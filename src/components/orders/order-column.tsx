import { cn } from "@/lib/utils";
import { OrderCard } from "@/components/orders/order-card";

type OrderItem = {
  id: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  notes: string | null;
};

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  tableNumber: string | null;
  notes: string | null;
  status: string;
  totalCents: number;
  createdAt: Date;
  items: OrderItem[];
};

// Uma coluna do quadro "Central de pedidos" (Recebidos → Em preparo →
// Prontos → Entregues). Puramente visual — usa o mesmo OrderCard e a mesma
// Server Action de sempre, só reorganiza a apresentação em colunas de
// status (padrão kanban) em vez das duas seções antigas (Em aberto /
// Histórico).
export function OrderColumn({
  title,
  count,
  dotClassName,
  orders,
  emptyLabel,
}: {
  title: string;
  count: number;
  dotClassName: string;
  orders: Order[];
  emptyLabel: string;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <span className={cn("size-2 shrink-0 rounded-full", dotClassName)} />
        {title}
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-zinc-400 ring-1 ring-white/10">
          {count}
        </span>
      </h2>
      <div className="flex flex-col gap-3">
        {orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-6 text-center text-xs text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </section>
  );
}
