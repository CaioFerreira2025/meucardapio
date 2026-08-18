"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Archive, ArchiveRestore, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderDetailsDialog } from "@/components/orders/order-details-dialog";
import { formatCents } from "@/lib/currency";
import { NEXT_ORDER_STATUS, ORDER_STATUS_LABEL, isOrderStatus } from "@/lib/order-status";
import { updateOrderStatus, setOrderArchived } from "@/app/(dashboard)/dashboard/orders/actions";

// Módulo "copiar-pedido": carregado sob demanda, e não com um import normal.
//
// Com import estático, o código do botão (e o montador do texto de WhatsApp)
// desceria junto com a Central de pedidos para TODO lojista, inclusive quem
// não contratou o módulo — o botão não apareceria, mas o download
// aconteceria. `dynamic` transforma isso num arquivo separado, buscado só
// quando `canCopyOrder` é verdadeiro. `ssr: false` porque ele só faz sentido
// depois de montado no navegador (usa a área de transferência).
const CopyOrderButton = dynamic(
  () => import("@/modules/copiar-pedido/copy-order-button").then((m) => m.CopyOrderButton),
  { ssr: false }
);

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
  deliveryFeeCents?: number;
  discountCents?: number;
  neighborhood?: string | null;
};

export function OrderCard({
  order,
  // Ligado só quando o módulo "copiar-pedido" está habilitado para este
  // restaurante (a página de Pedidos resolve isso no servidor). Quem não tem
  // o módulo não recebe `true` e o botão nem é renderizado.
  canCopyOrder = false,
}: {
  order: Order;
  canCopyOrder?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const nextStatus = isOrderStatus(order.status)
    ? NEXT_ORDER_STATUS[order.status]
    : null;
  const canCancel = order.status !== "completed" && order.status !== "cancelled";
  // Arquivar/restaurar funciona em qualquer status (não só "Entregue") —
  // não altera `status`, só o sinalizador `archived` (ver
  // `setOrderArchived`), então não mexe no fluxo Recebido -> Em preparo ->
  // Pronto -> Entregue. O lojista pode limpar o quadro ativo quando quiser
  // e resgatar depois em "Ver histórico arquivado".
  const canArchive = !order.archived;
  const canUnarchive = order.archived;

  // Qualquer clique no card (fora dos botões de ação, que têm
  // stopPropagation) abre o modal de detalhes completos — só leitura, não
  // interfere em nada do fluxo de status.
  function openDetails() {
    setDetailsOpen(true);
  }

  return (
    <>
      <Card
        onClick={openDetails}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDetails();
          }
        }}
        tabIndex={0}
        className="cursor-pointer transition-colors hover:ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
      >
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
          <CardAction className="flex items-center gap-1.5">
            {canCopyOrder && <CopyOrderButton order={order} />}
            {order.status === "completed" && (
              // Check verde dentro de um círculo — destaque visual de que o
              // pedido foi concluído com sucesso, além do badge de status.
              <CheckCircle2
                className="size-5 shrink-0 text-emerald-400"
                aria-label="Pedido concluído"
              />
            )}
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
            <span className="text-brand-300">{formatCents(order.totalCents)}</span>
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
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-400 hover:to-brand-300"
              onClick={(event) => {
                event.stopPropagation();
                startTransition(() => updateOrderStatus(order.id, nextStatus));
              }}
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
              onClick={(event) => {
                event.stopPropagation();
                startTransition(() => updateOrderStatus(order.id, "cancelled"));
              }}
            >
              Cancelar
            </Button>
          )}
          {canArchive && (
            // Discreto de propósito (texto pequeno, sem cor de destaque) —
            // não é uma ação do fluxo do pedido, só organização visual do
            // quadro. Some do Kanban ativo sem apagar do banco; fica
            // disponível em "Ver histórico arquivado" no topo da página.
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              className="w-full gap-1.5 text-xs text-muted-foreground hover:text-white"
              onClick={(event) => {
                event.stopPropagation();
                startTransition(() => setOrderArchived(order.id, true));
              }}
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
              onClick={(event) => {
                event.stopPropagation();
                startTransition(() => setOrderArchived(order.id, false));
              }}
            >
              <ArchiveRestore className="size-3.5" />
              Restaurar pedido
            </Button>
          )}
        </CardFooter>
        )}
      </Card>
      <OrderDetailsDialog order={order} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </>
  );
}
