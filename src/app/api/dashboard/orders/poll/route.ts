import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { prisma } from "@/lib/prisma";
import { getTablesAwaitingBill } from "@/lib/tables";

export const dynamic = "force-dynamic";

// Substitui a antiga rota de SSE (`/api/dashboard/orders/stream`), que
// mantinha uma conexão HTTP aberta indefinidamente e causava timeout na
// Vercel (funções serverless têm limite de tempo de execução). Aqui o
// painel busca o estado atual a cada 5s (ver OrderNotifications) — cada
// requisição é curta e stateless, e como a consulta vai direto no banco
// (fonte da verdade), funciona igual em qualquer instância serverless que
// atender a requisição (diferente do EventEmitter em memória antigo, que
// só funcionava dentro de um único processo Node).
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date(0);
  const sinceIsValid = !Number.isNaN(since.getTime());

  const [newOrders, tablesAwaitingBill] = await Promise.all([
    prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gt: sinceIsValid ? since : new Date(0) },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, customerName: true, tableNumber: true },
    }),
    getTablesAwaitingBill(restaurant.id),
  ]);

  return NextResponse.json({
    now: new Date().toISOString(),
    newOrders,
    tablesAwaitingBill: tablesAwaitingBill.map((table) => table.tableNumber),
  });
}
