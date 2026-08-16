"use client";

import { useTransition } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Archive, ArchiveRestore } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatCents } from "@/lib/currency";
import { NEXT_ORDER_STATUS, ORDER_STATUS_LABEL, isOrderStatus } from "@/lib/order-status";
import { updateOrderStatus, setOrderArchived } from "@/app/(dashboard)/dashboard/orders/actions";

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
  archived: boolean;
};

export function OrderCard({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition();
  const nextStatus = isOrderStatus(order.status)
    ? NEXT_ORDER_STATUS[order.status]
    : null;
  const canCancel = order.status !== "completed" && order.status !== "cancelled";
  // Arquivar/restaurar só faz sentido pra pedido já "Entregue" — não altera
  // `status`, só o sinalizador `archived` (ver `setOrderArchived`), então não
  // mexe no fluxo Recebido -> Em preparo -> Pronto -> Entregue.
  const canArchive = order.status === "completed" && !order.archived;
  const canUnarchive = order.status === "completed" && order.archived;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-white">
          {order.customerName}
          {order.tableNumber && (
            <span className="text-sm font-normal text-muted-foreground">
              · Mesa {order.tableNumber}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {order.customerPhone} ·{" "}
          {order.createdAt.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </CardDescription>
        <CardAction>
          <OrderStatusBadge status={order.status} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.quantity}x {item.productName}
              {item.notes && (
                <span className="text-muted-foreground"> — {item.notes}</span>
              )}
            </span>
            <span className="text-muted-foreground">
              {formatCents(item.unitPriceCents * item.quantity)}
            </span>
          </div>
        ))}
        {order.notes && (
          <p className="mt-2 text-sm text-muted-foreground">
            Obs: {order.notes}
          </p>
        )}
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-medium">
          <span>Total</span>
          <span className="text-orange-300">{formatCents(order.totalCents)}</span>
        </div>
      </CardContent>
      {(nextStatus || canCancel || canArchive || canUnarchive) && (
        // As colunas da Central de pedidos ficam bem estreitas em telas
        // grandes (4 colunas lado a lado) — texto como "Marcar como Em
        // preparo" ao lado de "Cancelar" não cabe numa única linha nessa
        // largura e ficava cortado. Empilhando os botões (`flex-col`) e
        // deixando cada um ocupar a largura toda (`w-full`) eles sempre
        // cabem por inteiro, em qualquer largura de coluna/tela.
        <CardFooter className="flex flex-col items-stretch gap-2">
          {nextStatus && (
            <Button
              size="sm"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-400 hover:to-rose-400"
              onClick={() =>
                startTransition(() => updateOrderStatus(order.id, nextStatus))
              }
            >
              Marcar como {ORDER_STATUS_LABEL[nextStatus]}
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              className="w-full"
              onClick={() =>
                startTransition(() => updateOrderStatus(order.id, "cancelled"))
              }
            >
              Cancelar
            </Button>
          )}
          {canArchive && (
            // Discreto de propósito (texto pequeno, sem cor de destaque) —
            // não é uma ação do fluxo do pedido, só organização visual do
            // quadro. Some da coluna "Entregues" sem apagar do banco; fica
            // disponível em "Ver histórico arquivado" no topo da página.
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              className="w-full gap-1.5 text-xs text-muted-foreground hover:text-white"
              onClick={() =>
                startTransition(() => setOrderArchived(order.id, true))
              }
            >
              <Archive className="size-3.5" />
              Ocultar pedido
            </Button>
          )}
          {canUnarchive && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              className="w-full gap-1.5 text-xs text-muted-foreground hover:text-white"
              onClick={() =>
                startTransition(() => setOrderArchived(order.id, false))
              }
            >
              <ArchiveRestore className="size-3.5" />
              Restaurar pedido
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
