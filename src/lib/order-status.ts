export const ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Recebido",
  preparing: "Em preparo",
  ready: "Pronto",
  completed: "Entregue",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_BADGE_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  preparing: "default",
  ready: "default",
  completed: "outline",
  cancelled: "destructive",
};

// Próximo passo "natural" no fluxo de um pedido, usado para o botão de
// avançar status no painel. `null` quando o pedido já está num estado final.
export const NEXT_ORDER_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
  completed: null,
  cancelled: null,
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
