"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRestaurantByOwnerId } from "@/lib/restaurant";
import { emitOrderEvent } from "@/lib/order-events";

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

  const restaurant = await getRestaurantByOwnerId(session.user.id);
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
