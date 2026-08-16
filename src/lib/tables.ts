import { prisma } from "@/lib/prisma";

// Pedidos "em aberto" — ainda não entregues nem cancelados. Usado para
// determinar quais pedidos pertencem a uma mesa que ainda está em uso e
// para o fechamento de mesa (Chamado de Mesa / Fechamento de Conta).
export const ACTIVE_ORDER_STATUSES = ["pending", "preparing", "ready"] as const;

export type TableBillOrder = {
  id: string;
  customerName: string;
  createdAt: Date;
  items: { id: string; productName: string; quantity: number; unitPriceCents: number }[];
};

export type TableBillRequest = {
  tableNumber: string;
  totalCents: number;
  orders: TableBillOrder[];
  requestedSince: Date;
};

// Agrupa por mesa os pedidos ativos que sinalizaram "pedir a conta"
// (Order.billRequested) — usado no alerta visual do painel (Visão Geral e
// Central de Pedidos) e na tela de fechamento de mesa.
export async function getTablesAwaitingBill(
  restaurantId: string
): Promise<TableBillRequest[]> {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      billRequested: true,
      status: { in: [...ACTIVE_ORDER_STATUSES] },
      tableNumber: { not: null },
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, TableBillRequest>();
  for (const order of orders) {
    const key = order.tableNumber!;
    const entry = map.get(key);
    const orderSummary: TableBillOrder = {
      id: order.id,
      customerName: order.customerName,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })),
    };

    if (entry) {
      entry.totalCents += order.totalCents;
      entry.orders.push(orderSummary);
      if (order.createdAt < entry.requestedSince) {
        entry.requestedSince = order.createdAt;
      }
    } else {
      map.set(key, {
        tableNumber: key,
        totalCents: order.totalCents,
        orders: [orderSummary],
        requestedSince: order.createdAt,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.tableNumber.localeCompare(b.tableNumber, "pt-BR", { numeric: true })
  );
}
