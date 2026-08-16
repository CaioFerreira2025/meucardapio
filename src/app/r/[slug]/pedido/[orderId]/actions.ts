"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { emitOrderEvent } from "@/lib/order-events";

// Status em que ainda faz sentido pedir a conta — do recebimento do pedido
// até "Entregue" (completed). Só um pedido cancelado fica de fora: não há
// conta a fechar para ele. "completed" entra aqui porque o cliente pode
// pedir a conta depois que a comida já chegou na mesa, antes de a equipe
// fechar a mesa/registrar o pagamento (Chamado de Mesa / Caixa).
const ACTIVE_STATUSES = ["pending", "preparing", "ready", "completed"];

export type RequestBillResult =
  | { success: true }
  | { success: false; error: string };

// Cliente (ou garçom, pela mesma tela pública) sinaliza que quer fechar a
// conta. Marca TODOS os pedidos ativos da mesma mesa — não só o pedido que
// está sendo acompanhado nessa página — para a equipe ver o valor certo ao
// fechar a mesa, mesmo com mais de um pedido feito separadamente.
export async function requestBill(orderId: string): Promise<RequestBillResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, restaurantId: true, tableNumber: true, status: true },
  });

  if (!order) {
    return { success: false, error: "Pedido não encontrado" };
  }

  if (!ACTIVE_STATUSES.includes(order.status)) {
    return {
      success: false,
      error: "Este pedido já foi encerrado.",
    };
  }

  if (order.tableNumber) {
    await prisma.order.updateMany({
      where: {
        restaurantId: order.restaurantId,
        tableNumber: order.tableNumber,
        status: { in: ACTIVE_STATUSES },
      },
      data: { billRequested: true },
    });
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: { billRequested: true },
    });
  }

  emitOrderEvent(order.restaurantId, {
    type: "bill_requested",
    orderId: order.id,
    tableNumber: order.tableNumber,
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");

  return { success: true };
}
