import { auth } from "@/auth";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { subscribeToOrderEvents, type OrderEvent } from "@/lib/order-events";

// Precisa ser sempre dinâmica (nunca cacheada/pré-renderizada) — é uma
// conexão de streaming de longa duração.
export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25_000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Não autenticado", { status: 401 });
  }

  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) {
    return new Response("Restaurante não encontrado", { status: 404 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: OrderEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      unsubscribe = subscribeToOrderEvents(restaurant.id, send);

      // Comentário SSE (ignorado pelo cliente) só para manter a conexão viva
      // atrás de proxies que fecham conexões ociosas.
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, HEARTBEAT_MS);

      controller.enqueue(encoder.encode(`: connected\n\n`));
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
