import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, isOrderStatus, type OrderStatus } from "@/lib/order-status";

// Cada status ganha uma cor própria (em vez das variantes genéricas do
// Badge) para dar leitura instantânea do estado do pedido de longe — útil
// numa cozinha/balcão em movimento.
const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-white/10 text-zinc-300 ring-white/10",
  preparing: "bg-orange-500/15 text-orange-300 ring-orange-500/25",
  ready: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  completed: "bg-white/5 text-zinc-500 ring-white/10",
  cancelled: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
};

const STATUS_DOT: Record<OrderStatus, string> = {
  pending: "bg-zinc-400",
  preparing: "bg-orange-400 animate-pulse",
  ready: "bg-emerald-400 animate-pulse",
  completed: "bg-zinc-600",
  cancelled: "bg-rose-400",
};

export function OrderStatusBadge({ status }: { status: string }) {
  if (!isOrderStatus(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10">
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        STATUS_STYLE[status]
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])} />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
