import { EventEmitter } from "node:events";

// Pub/sub em memória para notificar o painel sobre pedidos em tempo real
// (via SSE — ver src/app/api/dashboard/orders/stream/route.ts).
//
// LIMITAÇÃO IMPORTANTE: isso só funciona dentro de um único processo
// Node.js (ex.: `next start` num VPS/Docker, ou `next dev`). Em plataformas
// serverless com múltiplas instâncias (Vercel, etc.) cada instância tem sua
// própria memória, então um pedido criado numa instância não chega às
// conexões SSE abertas em outra. Esse app já assume um único processo por
// causa do SQLite; se migrar para Postgres + serverless, troque isso por um
// serviço de pub/sub real (Pusher, Ably, Supabase Realtime, Redis pub/sub).

export type OrderEvent =
  | { type: "new_order"; orderId: string }
  | { type: "status_changed"; orderId: string; status: string };

const globalForEvents = globalThis as unknown as {
  orderEvents: EventEmitter | undefined;
};

export const orderEvents = globalForEvents.orderEvents ?? new EventEmitter();
orderEvents.setMaxListeners(0); // várias abas/painéis podem escutar o mesmo restaurantId

// Ao contrário do singleton do Prisma (que só fixa em `globalThis` fora de
// produção, para sobreviver ao hot-reload do `next dev`), este precisa ficar
// fixo em `globalThis` SEMPRE, inclusive em produção: o `next start` empacota
// rotas/Server Actions em módulos separados, então sem isso a rota SSE e as
// actions que emitem eventos acabariam com instâncias de EventEmitter
// diferentes dentro do mesmo processo — os eventos nunca chegariam ao painel.
globalForEvents.orderEvents = orderEvents;

export function emitOrderEvent(restaurantId: string, event: OrderEvent) {
  orderEvents.emit(restaurantId, event);
}

export function subscribeToOrderEvents(
  restaurantId: string,
  listener: (event: OrderEvent) => void
) {
  orderEvents.on(restaurantId, listener);
  return () => {
    orderEvents.off(restaurantId, listener);
  };
}
