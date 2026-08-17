"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { isPaymentMethod } from "@/lib/payment-method";
import { ACTIVE_ORDER_STATUSES } from "@/lib/tables";

const VALID_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export async function updateOrderStatus(orderId: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    throw new Error("Status inválido");
  }

  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) {
    throw new Error("Restaurante não encontrado");
  }

  await prisma.order.updateMany({
    where: { id: orderId, restaurantId: restaurant.id },
    data: { status },
  });

  revalidatePath("/dashboard/orders");
}

// Fecha uma mesa: marca todos os pedidos ativos dessa mesa como "completed"
// com a forma de pagamento informada e limpa o sinalizador de conta
// solicitada. Usado no fluxo de Chamado de Mesa / Fechamento de Conta.
export async function closeTable(tableNumber: string, paymentMethod: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  if (!isPaymentMethod(paymentMethod)) {
    throw new Error("Forma de pagamento inválida");
  }

  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) {
    throw new Error("Restaurante não encontrado");
  }

  // Pedidos ainda em andamento (pending/preparing/ready) OU já "Entregue"
  // mas sem forma de pagamento registrada ainda — esse segundo caso é o que
  // faltava aqui: o alerta "X mesas pediram a conta" (getTablesAwaitingBill)
  // já mostra mesas com pedido "Entregue" aguardando pagamento (o cliente
  // pode pedir a conta pelo painel de acompanhamento assim que o pedido
  // chega), mas como esta busca só olhava status ativo, clicar em "Fechar
  // mesa" nesse caso falhava com "Nenhum pedido em aberto encontrado" — a
  // mesa nunca fechava por aqui. Pedido "Entregue" que JÁ tem forma de
  // pagamento (já fechado antes) fica de fora, pra não mexer de novo nele.
  const ordersToClose = await prisma.order.findMany({
    where: {
      restaurantId: restaurant.id,
      tableNumber,
      OR: [
        { status: { in: [...ACTIVE_ORDER_STATUSES] } },
        { status: "completed", paymentMethod: null },
      ],
    },
    select: { id: true },
  });

  if (ordersToClose.length === 0) {
    throw new Error("Nenhum pedido em aberto encontrado para essa mesa.");
  }

  await prisma.order.updateMany({
    where: { id: { in: ordersToClose.map((o) => o.id) } },
    data: { status: "completed", paymentMethod, billRequested: false },
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/caixa");
}

// Arquiva/desarquiva um pedido na Central de pedidos — puramente
// visual/organizacional (some do quadro kanban ativo pra o lojista limpar a
// tela quando quiser, mas continua no banco e reaparece em "Histórico
// arquivado"). Funciona em qualquer status (inclusive pedidos ativos, a
// pedido do lojista). Isolada de propósito: não mexe em `status` nem em
// nenhum outro campo, então não interfere no fluxo Recebido -> Em preparo ->
// Pronto -> Entregue.
export async function setOrderArchived(orderId: string, archived: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) {
    throw new Error("Restaurante não encontrado");
  }

  await prisma.order.updateMany({
    where: { id: orderId, restaurantId: restaurant.id },
    data: { archived },
  });

  revalidatePath("/dashboard/orders");
}
