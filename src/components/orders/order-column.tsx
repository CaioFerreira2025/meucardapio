import { cn } from "@/lib/utils";
import { OrderCard } from "@/components/orders/order-card";

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

// Uma coluna do quadro "Central de pedidos" (Recebidos → Em preparo →
// Prontos → Entregues). Puramente visual — usa o mesmo OrderCard e a mesma
// Server Action de sempre, só reorganiza a apresentação em colunas de
// status (padrão kanban) em vez das duas seções antigas (Em aberto /
// Histórico).
export function OrderColumn({
  title,
  count,
  dotClassName,
  orders,
  emptyLabel,
  canCopyOrder = false,
}: {
  title: string;
  count: number;
  dotClassName: string;
  orders: Order[];
  emptyLabel: string;
  canCopyOrder?: boolean;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="flex shrink-0 items-center gap-2 text-sm font-semibold text-white">
        <span className={cn("size-2 shrink-0 rounded-full", dotClassName)} />
        {title}
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-zinc-400 ring-1 ring-white/10">
          {count}
        </span>
      </h2>
      {/* Cada coluna rola de forma independente, com altura máxima
          proporcional à tela (calc(100dvh - Npx), descontando topbar +
          cabeçalho da página + título/contador da própria coluna) — assim a
          coluna "Entregues" (que só cresce) nunca mais estica a página
          inteira pra baixo; só o conteúdo da coluna rola, o quadro kanban
          como um todo fica fixo na tela. `dvh` em vez de `vh` pelo mesmo
          motivo do resto do painel: acompanha a altura real visível em
          telas de celular.
          `[&>*]:shrink-0` é essencial aqui: sem isso, os cards (filhos de um
          flex-col) tinham `min-height:auto` zerado pelo próprio
          `overflow-hidden` do Card (regra do flexbox pra automatic minimum
          size), então em colunas com muitos pedidos o navegador ESPREMIA
          todos os cards pra caber na altura máxima em vez de deixar a
          coluna rolar — cards ficavam cortados/ilegíveis. Marcando os
          cards como não-encolhíveis, eles mantêm a altura natural e o
          excesso vira scroll, como deveria. */}
      <div className="flex max-h-[calc(100dvh-220px)] flex-col gap-3 overflow-y-auto pr-1 [&>*]:shrink-0">
        {orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-6 text-center text-xs text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} canCopyOrder={canCopyOrder} />
          ))
        )}
      </div>
    </section>
  );
}
