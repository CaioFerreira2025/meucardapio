"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 5000;

type PollResponse = {
  now: string;
  newOrders: { id: string; customerName: string; tableNumber: string | null }[];
  tablesAwaitingBill: string[];
};

// Antes escutava novos pedidos e mudanças de status via Server-Sent Events
// (conexão HTTP aberta indefinidamente). Isso causava timeout na Vercel,
// já que funções serverless têm limite de tempo de execução — e o
// EventEmitter em memória que alimentava o SSE só funcionava dentro de um
// único processo Node, então nem sempre entregava os eventos em produção
// (múltiplas instâncias serverless). Agora o painel busca o estado atual
// via GET /api/dashboard/orders/poll a cada 5s (setTimeout encadeado, não
// setInterval, pra nunca sobrepor requisições se uma demorar mais que
// 5s). Montado uma vez no layout do painel, então funciona em qualquer
// página do dashboard.
export function OrderNotifications() {
  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Timestamp vem do relógio do próprio servidor (campo `now` da
    // resposta), não do cliente — evita bugs por diferença de horário
    // entre cliente e servidor.
    let since: string | null = null;
    let isFirstPoll = true;
    let knownBillTables = new Set<string>();

    async function poll() {
      try {
        const url = since
          ? `/api/dashboard/orders/poll?since=${encodeURIComponent(since)}`
          : "/api/dashboard/orders/poll";
        const response = await fetch(url, { cache: "no-store" });

        if (cancelled) return;

        if (!response.ok) {
          scheduleNext();
          return;
        }

        const data: PollResponse = await response.json();
        if (cancelled) return;

        const currentBillTables = new Set(data.tablesAwaitingBill);

        if (isFirstPoll) {
          // Primeiro poll só estabelece a base (pedidos e mesas já
          // existentes quando o painel foi aberto) — sem toast, igual ao
          // comportamento antigo de não notificar nada só por conectar.
          isFirstPoll = false;
        } else {
          for (let i = 0; i < data.newOrders.length; i++) {
            toast.success("Novo pedido recebido!", {
              description: "Toque para ver em Pedidos.",
              action: {
                label: "Ver",
                onClick: () => routerRef.current.push("/dashboard/orders"),
              },
            });
          }

          for (const tableNumber of currentBillTables) {
            if (!knownBillTables.has(tableNumber)) {
              toast.info(`Mesa ${tableNumber} pediu a conta!`, {
                description: "Toque para ver em Pedidos.",
                action: {
                  label: "Ver",
                  onClick: () => routerRef.current.push("/dashboard/orders"),
                },
              });
            }
          }

          // Mantém o painel sempre atualizado (inclusive para mudanças de
          // status, que não têm toast próprio) — replica o
          // `router.refresh()` disparado a cada evento do SSE antigo,
          // agora numa cadência de 5s.
          routerRef.current.refresh();
        }

        since = data.now;
        knownBillTables = currentBillTables;
        scheduleNext();
      } catch {
        // Falha de rede pontual — tenta de novo no próximo ciclo.
        scheduleNext();
      }
    }

    function scheduleNext() {
      if (cancelled) return;
      timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
