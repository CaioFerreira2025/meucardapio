import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { getTablesAwaitingBill } from "@/lib/tables";
import { pageTitle } from "@/config/brand";
import { OrderColumn } from "@/components/orders/order-column";
import { OrderCard } from "@/components/orders/order-card";
import { BillRequestsAlert } from "@/components/tables/bill-requests-alert";

export const metadata: Metadata = {
  title: pageTitle("Pedidos"),
};

export default async function OrdersPage() {
  const restaurant = await getEffectiveRestaurant();

  const tablesAwaitingBill = await getTablesAwaitingBill(restaurant!.id);

  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant!.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 150,
  });

  // Central de pedidos: mesmo sistema de pedidos/status de sempre
  // (ORDER_STATUSES, updateOrderStatus), só reorganizado em quadro por
  // etapa — Recebidos → Em preparo → Prontos → Entregues — em vez das duas
  // seções antigas (Em aberto / Histórico).
  const received = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");
  const delivered = orders.filter((o) => o.status === "completed");
  const cancelled = orders.filter((o) => o.status === "cancelled");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Central de pedidos
        </h1>
        <p className="text-muted-foreground">
          Acompanhe cada pedido do recebimento até a entrega.
        </p>
      </div>

      <BillRequestsAlert tables={tablesAwaitingBill} />

      <div className="grid gap-6 lg:grid-cols-4">
        <OrderColumn
          title="Recebidos"
          count={received.length}
          dotClassName="bg-zinc-400"
          orders={received}
          emptyLabel="Nenhum pedido novo."
        />
        <OrderColumn
          title="Em preparo"
          count={preparing.length}
          dotClassName="bg-orange-400 animate-pulse"
          orders={preparing}
          emptyLabel="Nada em preparo agora."
        />
        <OrderColumn
          title="Prontos"
          count={ready.length}
          dotClassName="bg-emerald-400 animate-pulse"
          orders={ready}
          emptyLabel="Nenhum pedido pronto."
        />
        <OrderColumn
          title="Entregues"
          count={delivered.length}
          dotClassName="bg-zinc-600"
          orders={delivered}
          emptyLabel="Nenhuma entrega ainda."
        />
      </div>

      {cancelled.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-white/10 pt-6">
          <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <span className="size-2 shrink-0 rounded-full bg-rose-400" />
            Cancelados
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-zinc-400 ring-1 ring-white/10">
              {cancelled.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cancelled.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
