import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRestaurantByOwnerId } from "@/lib/restaurant";
import { pageTitle } from "@/config/brand";
import { CaixaClient } from "@/components/caixa/caixa-client";

export const metadata: Metadata = {
  title: pageTitle("Caixa"),
};

export default async function CaixaPage() {
  const session = await auth();
  const restaurant = await getRestaurantByOwnerId(session!.user!.id);
  const restaurantId = restaurant!.id;

  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  const [openSession, todayOrders, recentClosedSessions] = await Promise.all([
    prisma.cashSession.findFirst({
      where: { restaurantId, status: "open" },
    }),
    prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startOfToday },
        status: { not: "cancelled" },
      },
      select: {
        id: true,
        customerName: true,
        tableNumber: true,
        totalCents: true,
        paymentMethod: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cashSession.findMany({
      where: { restaurantId, status: "closed" },
      orderBy: { closedAt: "desc" },
      take: 5,
    }),
  ]);

  // Quebra do faturamento de hoje por forma de pagamento — só considera
  // pedidos já marcados; "unset" mostra o que ainda falta o operador
  // classificar (ver seção "Pedidos sem forma de pagamento" no client).
  const breakdown = { cash: 0, pix: 0, card: 0, unset: 0 };
  for (const order of todayOrders) {
    if (order.paymentMethod === "cash") breakdown.cash += order.totalCents;
    else if (order.paymentMethod === "pix") breakdown.pix += order.totalCents;
    else if (order.paymentMethod === "card") breakdown.card += order.totalCents;
    else breakdown.unset += order.totalCents;
  }
  const todayTotalCents = todayOrders.reduce((sum, o) => sum + o.totalCents, 0);

  const untaggedOrders = todayOrders
    .filter((o) => !o.paymentMethod)
    .map((o) => ({
      id: o.id,
      customerName: o.customerName,
      tableNumber: o.tableNumber,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
    }));

  // Prévia ao vivo do saldo esperado enquanto o turno está aberto (mesmo
  // cálculo que será refeito no servidor na hora de fechar).
  let cashRevenueSinceOpenCents = 0;
  if (openSession) {
    cashRevenueSinceOpenCents = todayOrders
      .filter(
        (o) =>
          o.paymentMethod === "cash" && o.createdAt >= openSession.openedAt
      )
      .reduce((sum, o) => sum + o.totalCents, 0);
    // Turno pode ter aberto num dia anterior (esquecido de fechar) — nesse
    // caso os pedidos de hoje não cobrem tudo; buscamos à parte para não
    // subestimar o saldo esperado.
    if (openSession.openedAt < startOfToday) {
      const olderCashOrders = await prisma.order.findMany({
        where: {
          restaurantId,
          paymentMethod: "cash",
          status: { not: "cancelled" },
          createdAt: { gte: openSession.openedAt, lt: startOfToday },
        },
        select: { totalCents: true },
      });
      cashRevenueSinceOpenCents += olderCashOrders.reduce(
        (sum, o) => sum + o.totalCents,
        0
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Caixa</h1>
        <p className="text-muted-foreground">
          Controle o faturamento do dia e feche o turno com o saldo da
          gaveta.
        </p>
      </div>

      <CaixaClient
        openSession={
          openSession
            ? {
                id: openSession.id,
                openedAt: openSession.openedAt,
                openingCents: openSession.openingCents,
                cashRevenueSinceOpenCents,
              }
            : null
        }
        breakdown={breakdown}
        todayTotalCents={todayTotalCents}
        untaggedOrders={untaggedOrders}
        recentClosedSessions={recentClosedSessions.map((s) => ({
          id: s.id,
          openedAt: s.openedAt,
          closedAt: s.closedAt!,
          openingCents: s.openingCents,
          closingCents: s.closingCents!,
          expectedCents: s.expectedCents!,
        }))}
      />
    </div>
  );
}
