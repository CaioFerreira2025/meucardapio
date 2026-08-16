"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { isPaymentMethod } from "@/lib/payment-method";

async function requireRestaurant() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }
  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) {
    throw new Error("Restaurante não encontrado");
  }
  return restaurant;
}

// Soma o faturamento em dinheiro dos pedidos válidos criados desde a
// abertura do turno — usado tanto para o "saldo esperado" ao vivo (painel
// aberto) quanto para o cálculo definitivo no fechamento.
async function cashRevenueSinceCents(restaurantId: string, since: Date) {
  const cashOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      paymentMethod: "cash",
      status: { not: "cancelled" },
      createdAt: { gte: since },
    },
    select: { totalCents: true },
  });
  return cashOrders.reduce((sum, o) => sum + o.totalCents, 0);
}

export async function openCashSession(openingCents: number) {
  const restaurant = await requireRestaurant();

  const existingOpen = await prisma.cashSession.findFirst({
    where: { restaurantId: restaurant.id, status: "open" },
  });
  if (existingOpen) {
    throw new Error("Já existe um turno de caixa aberto.");
  }

  if (!Number.isFinite(openingCents) || openingCents < 0) {
    throw new Error("Valor de abertura inválido.");
  }

  await prisma.cashSession.create({
    data: {
      restaurantId: restaurant.id,
      openingCents: Math.round(openingCents),
    },
  });

  revalidatePath("/dashboard/caixa");
}

export async function closeCashSession(sessionId: string, closingCents: number) {
  const restaurant = await requireRestaurant();

  if (!Number.isFinite(closingCents) || closingCents < 0) {
    throw new Error("Valor de contagem inválido.");
  }

  const session = await prisma.cashSession.findFirst({
    where: { id: sessionId, restaurantId: restaurant.id, status: "open" },
  });
  if (!session) {
    throw new Error("Turno não encontrado ou já fechado.");
  }

  // Recalcula o saldo esperado no servidor (nunca confia num valor vindo do
  // cliente) — abertura + tudo que foi marcado como "Dinheiro" desde que o
  // turno abriu.
  const cashRevenueCents = await cashRevenueSinceCents(
    restaurant.id,
    session.openedAt
  );
  const expectedCents = session.openingCents + cashRevenueCents;

  await prisma.cashSession.update({
    where: { id: sessionId },
    data: {
      status: "closed",
      closedAt: new Date(),
      closingCents: Math.round(closingCents),
      expectedCents,
    },
  });

  revalidatePath("/dashboard/caixa");
}

export async function setOrderPaymentMethod(orderId: string, paymentMethod: string) {
  const restaurant = await requireRestaurant();

  if (!isPaymentMethod(paymentMethod)) {
    throw new Error("Forma de pagamento inválida");
  }

  await prisma.order.updateMany({
    where: { id: orderId, restaurantId: restaurant.id },
    data: { paymentMethod },
  });

  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard/orders");
}
