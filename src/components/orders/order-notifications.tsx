"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type OrderEvent =
  | { type: "new_order"; orderId: string }
  | { type: "status_changed"; orderId: string; status: string };

// Escuta novos pedidos e mudanças de status via Server-Sent Events e
// atualiza os dados do dashboard automaticamente. Montado uma vez no
// layout do painel, então funciona em qualquer página do dashboard.
export function OrderNotifications() {
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource("/api/dashboard/orders/stream");

    eventSource.onmessage = (event) => {
      let payload: OrderEvent;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (payload.type === "new_order") {
        toast.success("Novo pedido recebido!", {
          description: "Toque para ver em Pedidos.",
          action: {
            label: "Ver",
            onClick: () => router.push("/dashboard/orders"),
          },
        });
      }

      router.refresh();
    };

    // EventSource já reconecta sozinho em caso de queda de conexão; não é
    // necessário nenhum retry manual aqui.
    eventSource.onerror = () => {
      // silencioso — o navegador tenta reconectar automaticamente
    };

    return () => {
      eventSource.close();
    };
  }, [router]);

  return null;
}
