"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ClipboardList, Receipt, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, isOrderStatus } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { readLastOrder } from "@/lib/last-order";
import { requestBill } from "@/app/r/[slug]/pedido/[orderId]/actions";

// Mesmo "caminho feliz" da tela de acompanhamento completa
// (src/app/r/[slug]/pedido/[orderId]/page.tsx) — pedidos cancelados não
// entram na barra de progresso.
const HAPPY_PATH = ORDER_STATUSES.filter((s) => s !== "cancelled");

type OrderStatusInfo = {
  id: string;
  status: string;
  tableNumber: string | null;
  billRequested: boolean;
  paymentMethod: string | null;
};

// A "sessão" da mesa (ver localStorage em menu-client.tsx) é considerada
// ativa — e o painel flutuante aparece — enquanto o pedido não foi
// cancelado e, se já "Entregue", a conta ainda não foi fechada pela equipe
// (sem forma de pagamento registrada — ver closeTable em
// dashboard/orders/actions.ts). Assim que a mesa é fechada no Caixa, o
// painel some sozinho no próximo poll: a mesa está livre para um cliente
// novo, sem nenhum resquício do pedido anterior atrapalhando.
function isSessionActive(order: OrderStatusInfo | null): order is OrderStatusInfo {
  if (!order) return false;
  if (order.status === "cancelled") return false;
  if (order.status === "completed" && order.paymentMethod) return false;
  return true;
}

// Painel flutuante mostrado quando o cliente reabre o cardápio (ou escaneia
// o QR Code de novo) numa mesa onde já existe um pedido em andamento ou
// entregue com a conta em aberto (ver src/lib/last-order.ts, que guarda o
// último orderId feito neste navegador). Faz polling leve (a cada 5s, mesmo
// padrão do painel do lojista em OrderNotifications) numa rota pública
// somente-leitura — não altera nada no fluxo de status, só lê e, quando o
// cliente pede, aciona a mesma action `requestBill` já usada na tela de
// acompanhamento completa.
//
// A leitura do localStorage (readLastOrder) e o fetch acontecem só dentro
// do efeito abaixo, nunca durante a primeira renderização — o componente
// sempre começa com `order = null` (idêntico no servidor e no cliente), o
// que evita divergir do HTML já enviado pelo servidor (hydration mismatch).
export function ActiveOrderPanel({ slug }: { slug: string }) {
  const [order, setOrder] = useState<OrderStatusInfo | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);

  useEffect(() => {
    const storedOrderId = readLastOrder(slug)?.orderId;
    if (!storedOrderId) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/r/${slug}/orders/${storedOrderId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setOrder(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setOrder(data.order as OrderStatusInfo);
      } catch {
        // Rede instável — mantém o último estado conhecido na tela e tenta
        // de novo no próximo ciclo, sem derrubar o painel por causa de uma
        // falha passageira.
      }
    }

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slug]);

  if (!isSessionActive(order)) return null;

  // Capturado numa constante à parte: o TypeScript não propaga o
  // estreitamento de `order` (de `OrderStatusInfo | null` pra
  // `OrderStatusInfo`) pra dentro de funções aninhadas definidas depois do
  // `if` acima, mesmo sendo `const` — `activeOrder` resolve isso.
  const activeOrder = order;

  const statusLabel = isOrderStatus(activeOrder.status)
    ? ORDER_STATUS_LABEL[activeOrder.status]
    : activeOrder.status;
  const currentStepIndex = (HAPPY_PATH as readonly string[]).indexOf(
    isOrderStatus(activeOrder.status) ? activeOrder.status : "pending"
  );
  // "Pedir a conta" só aparece quando o pedido já está "Entregue" — pedido
  // deste painel específico; a tela de acompanhamento completa
  // (/pedido/[orderId]) continua liberando isso mais cedo, sem mudança.
  const canRequestBill = activeOrder.status === "completed";

  async function handleRequestBill() {
    setIsRequestingBill(true);
    const result = await requestBill(activeOrder.id);
    setIsRequestingBill(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Conta solicitada! A equipe já foi avisada.");
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed top-4 left-4 z-40 flex items-center gap-2 rounded-full bg-popover/95 px-4 py-2.5 text-sm font-medium text-white shadow-xl ring-1 ring-white/10 backdrop-blur-xl transition-transform active:scale-95"
      >
        <span className="size-2 shrink-0 animate-pulse rounded-full bg-orange-400" />
        Pedido: {statusLabel}
        <ChevronDown className="size-3.5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 top-4 z-40 sm:inset-x-auto sm:right-4 sm:w-96">
      <div className="rounded-2xl border border-white/10 bg-popover/95 p-4 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Você já tem um pedido nesta mesa
            </p>
            {activeOrder.tableNumber && (
              <p className="text-xs text-muted-foreground">
                Mesa {activeOrder.tableNumber}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Minimizar painel de acompanhamento"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center">
          {HAPPY_PATH.map((step, index) => {
            const isDone = index <= currentStepIndex;
            const isLast = index === HAPPY_PATH.length - 1;
            return (
              <div key={step} className={cn("flex items-center", !isLast && "flex-1")}>
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full ring-1 transition-colors",
                    isDone
                      ? "bg-gradient-to-br from-orange-500 to-rose-500 text-white ring-orange-500/30"
                      : "bg-white/5 text-muted-foreground ring-white/10"
                  )}
                >
                  {isDone ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : (
                    <span className="text-[10px]">{index + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "mx-1 h-0.5 flex-1 rounded-full transition-colors",
                      index < currentStepIndex ? "bg-orange-500" : "bg-white/10"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Status atual: <span className="font-medium text-white">{statusLabel}</span>
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            render={
              <Link href={`/r/${slug}/pedido/${activeOrder.id}`}>
                <ClipboardList className="size-4" />
                Ver detalhes do pedido
              </Link>
            }
          />
          {canRequestBill && (
            <Button
              size="sm"
              disabled={activeOrder.billRequested || isRequestingBill}
              className="w-full gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-400 hover:to-rose-400"
              onClick={handleRequestBill}
            >
              <Receipt className="size-4" />
              {activeOrder.billRequested
                ? "Conta solicitada"
                : isRequestingBill
                  ? "Enviando..."
                  : "Pedir a conta"}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="w-full"
            onClick={() => setCollapsed(true)}
          >
            Fazer novo pedido
          </Button>
        </div>
      </div>
    </div>
  );
}
