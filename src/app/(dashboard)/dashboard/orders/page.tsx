import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { getTablesAwaitingBill } from "@/lib/tables";
import { pageTitle } from "@/config/brand";
import { OrderColumn } from "@/components/orders/order-column";
import { OrderCard } from "@/components/orders/order-card";
import { BillRequestsAlert } from "@/components/tables/bill-requests-alert";
import { ArchivedOrdersSection } from "@/components/orders/archived-orders-section";
import { PaywallScreen } from "@/components/billing/paywall-screen";
import { getAccessState } from "@/lib/access";
import { PageHelp } from "@/components/dashboard/page-help";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: pageTitle("Pedidos"),
};

export default async function OrdersPage() {
  // Paywall: com o teste expirado (ou pagamento pendente/assinatura
  // encerrada) esta tela dá lugar à escolha de plano. Só "Cobrança" e
  // "Configurações" seguem liberadas — são justamente as telas que o lojista
  // precisa para voltar a ficar em dia.
  const access = await getAccessState();
  if (!access.hasFullAccess) {
    return <PaywallScreen state={access} />;
  }

  const restaurant = await getEffectiveRestaurant();

  const tablesAwaitingBill = await getTablesAwaitingBill(restaurant!.id);

  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant!.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 150,
  });

  // Central de pedidos: mesmo sistema de pedidos/status de sempre
  // (ORDER_STATUSES, updateOrderStatus), só reorganizado em quadro por
  // etapa — Recebidos → Em preparo → Prontos → Entregues — em vez das duas
  // seções antigas (Em aberto / Histórico).
  //
  // Pedidos que o lojista arquivou (botão "Ocultar pedido", disponível em
  // qualquer coluna) saem do quadro ativo pra ele poder limpar a tela
  // quando quiser, mas continuam no banco e aparecem em "Ver histórico
  // arquivado" — não importa o status em que estavam quando arquivados.
  const received = orders.filter((o) => o.status === "pending" && !o.archived);
  const preparing = orders.filter((o) => o.status === "preparing" && !o.archived);
  const ready = orders.filter((o) => o.status === "ready" && !o.archived);
  const delivered = orders.filter((o) => o.status === "completed" && !o.archived);
  const cancelled = orders.filter((o) => o.status === "cancelled" && !o.archived);
  const archivedOrders = orders.filter((o) => o.archived);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="flex items-center gap-1 text-2xl font-semibold tracking-tight text-white">
          Central de pedidos
          <PageHelp page="orders" />
        </h1>
        <p className="text-muted-foreground">
          Acompanhe cada pedido do recebimento até a entrega.
        </p>
      </div>

      <ArchivedOrdersSection orders={archivedOrders} />

      <BillRequestsAlert tables={tablesAwaitingBill} />

      {orders.length === 0 ? (
        // Diferente das colunas vazias (que só dizem "nenhum pedido"), este
        // estado aparece quando NUNCA houve pedido: aí a dúvida do lojista
        // não é "cadê os pedidos", é "isso aqui funciona?".
        <EmptyState
          icon={ClipboardList}
          title="Os pedidos aparecem aqui, em tempo real"
          description="Assim que um cliente escanear o QR Code e finalizar um pedido, ele surge nesta tela automaticamente — sem precisar atualizar a página. Cada pedido caminha por Recebido, Em preparo, Pronto e Entregue."
          action={{ label: "Divulgar meu cardápio", href: "/dashboard" }}
          secondaryAction={{ label: "Lançar pedido na comanda", href: "/dashboard/comanda" }}
        />
      ) : (
      <div className="grid gap-6 lg:grid-cols-4">
        <OrderColumn
          title="Recebidos"
          count={received.length}
          dotClassName="bg-zinc-400"
          orders={received}
          emptyLabel="Nenhum pedido novo."
        />
        <OrderColumn
          title="Em preparo"
          count={preparing.length}
          dotClassName="bg-orange-400 animate-pulse"
          orders={preparing}
          emptyLabel="Nada em preparo agora."
        />
        <OrderColumn
          title="Prontos"
          count={ready.length}
          dotClassName="bg-emerald-400 animate-pulse"
          orders={ready}
          emptyLabel="Nenhum pedido pronto."
        />
        <OrderColumn
          title="Entregues"
          count={delivered.length}
          dotClassName="bg-zinc-600"
          orders={delivered}
          emptyLabel="Nenhuma entrega ainda."
        />
      </div>
      )}

      {cancelled.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-white/10 pt-6">
          <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <span className="size-2 shrink-0 rounded-full bg-rose-400" />
            Cancelados
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-zinc-400 ring-1 ring-white/10">
              {cancelled.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cancelled.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
