"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { emitOrderEvent } from "@/lib/order-events";
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

  const result = await prisma.order.updateMany({
    where: { id: orderId, restaurantId: restaurant.id },
    data: { status },
  });

  if (result.count > 0) {
    emitOrderEvent(restaurant.id, { type: "status_changed", orderId, status });
  }

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

  const activeOrders = await prisma.order.findMany({
    where: {
      restaurantId: restaurant.id,
      tableNumber,
      status: { in: [...ACTIVE_ORDER_STATUSES] },
    },
    select: { id: true },
  });

  if (activeOrders.length === 0) {
    throw new Error("Nenhum pedido em aberto encontrado para essa mesa.");
  }

  await prisma.order.updateMany({
    where: { id: { in: activeOrders.map((o) => o.id) } },
    data: { status: "completed", paymentMethod, billRequested: false },
  });

  for (const order of activeOrders) {
    emitOrderEvent(restaurant.id, {
      type: "status_changed",
      orderId: order.id,
      status: "completed",
    });
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/caixa");
}
