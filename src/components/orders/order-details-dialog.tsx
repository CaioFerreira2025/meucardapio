"use client";

import { CheckCircle2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatCents } from "@/lib/currency";

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
  updatedAt: Date;
  items: OrderItem[];
  archived: boolean;
};

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

// Modal com os detalhes completos de um pedido — aberta ao clicar em
// qualquer card da Central de pedidos (ver OrderCard). Só leitura: nenhuma
// ação daqui muda o pedido (a mudança de status/cancelamento/arquivar
// continua nos botões do próprio card).
export function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {order.status === "completed" && (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
            )}
            Pedido de {order.customerName}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do pedido, incluindo itens, valores e dados do
            cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <OrderStatusBadge status={order.status} />
          {order.archived && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-zinc-400 ring-1 ring-white/10">
              Arquivado
            </span>
          )}
        </div>

        <section className="flex flex-col gap-1 rounded-lg bg-white/[0.03] p-3 text-sm">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Cliente
          </h3>
          <p className="text-white">{order.customerName}</p>
          <p className="text-muted-foreground">{order.customerPhone}</p>
          {order.tableNumber && (
            <p className="text-muted-foreground">Mesa {order.tableNumber}</p>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Itens do pedido
          </h3>
          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.quantity}x {item.productName}
                  {item.notes && (
                    <span className="block text-xs text-muted-foreground">
                      Obs: {item.notes}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {formatCents(item.unitPriceCents * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {order.notes && (
            <p className="mt-1 rounded-lg bg-white/[0.03] p-3 text-sm text-muted-foreground">
              Observações do pedido: {order.notes}
            </p>
          )}

          <div className="mt-1 flex justify-between border-t border-border pt-2 text-sm font-medium">
            <span>Total</span>
            <span className="text-brand-300">{formatCents(order.totalCents)}</span>
          </div>
        </section>

        <section className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p>
            Recebido em{" "}
            {order.createdAt.toLocaleString("pt-BR", DATE_TIME_FORMAT)}
          </p>
          <p>
            Última atualização em{" "}
            {order.updatedAt.toLocaleString("pt-BR", DATE_TIME_FORMAT)}
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
