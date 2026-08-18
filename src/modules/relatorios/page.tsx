import { BarChart3, Receipt, TrendingUp, Wallet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/currency";
import { startOfTodayForRestaurant } from "@/lib/timezone";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { ModulePageProps } from "@/modules/registry";

// ============================================================================
// MÓDULO: Relatórios  (chave "relatorios")
// ============================================================================
//
// Serve como referência de como um módulo é escrito. Repare no que ele NÃO
// faz e no que ele NÃO precisa saber:
//
//  - não checa assinatura nem permissão: quando este componente roda, a rota
//    (src/app/(dashboard)/dashboard/m/[module]/page.tsx) já garantiu as duas
//    coisas. Módulo não repete regra de acesso;
//  - não sabe em que URL está montado nem aparece em nenhum menu — quem
//    cuida disso é o registro;
//  - não é importado por nenhum arquivo do painel base. A única referência a
//    ele é o `import()` dentro de `load`, em src/modules/registry.ts, que só
//    executa para quem tem o módulo ligado.
//
// A consequência prática: dá para reescrever, quebrar ou apagar esta pasta
// inteira sem risco para o painel de quem não tem o módulo.
//
// Pode ler o banco à vontade (recebe `restaurantId` já resolvido e
// autorizado), e pode criar tabelas próprias se precisar — o importante é
// não alterar tabelas do núcleo, para o módulo continuar removível.

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function RelatoriosModule({ restaurantId }: ModulePageProps) {
  // Últimos 30 dias, a partir da meia-noite de hoje no fuso do restaurante
  // (mesma regra do resto do painel — ver src/lib/timezone.ts).
  const endOfPeriod = new Date(startOfTodayForRestaurant().getTime() + DAY_MS);
  const startOfPeriod = new Date(endOfPeriod.getTime() - 30 * DAY_MS);

  const [orders, items] = await Promise.all([
    prisma.order.findMany({
      where: {
        restaurantId,
        status: { not: "cancelled" },
        createdAt: { gte: startOfPeriod, lt: endOfPeriod },
      },
      select: { totalCents: true, createdAt: true },
    }),
    prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          status: { not: "cancelled" },
          createdAt: { gte: startOfPeriod, lt: endOfPeriod },
        },
      },
      select: { productName: true, quantity: true, unitPriceCents: true },
    }),
  ]);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Ainda não há vendas neste período"
        description="Este relatório considera os últimos 30 dias. Assim que os pedidos começarem a entrar, o faturamento, o ticket médio e o ranking de produtos aparecem aqui."
        action={{ label: "Ver pedidos", href: "/dashboard/orders" }}
      />
    );
  }

  const totalCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const averageTicketCents = Math.round(totalCents / orders.length);

  // Ranking por quantidade vendida (não por faturamento) — um item caro
  // vendido uma vez não deve liderar um ranking de "mais vendidos".
  const byProduct = new Map<string, { quantity: number; revenueCents: number }>();
  for (const item of items) {
    const current = byProduct.get(item.productName) ?? { quantity: 0, revenueCents: 0 };
    current.quantity += item.quantity;
    current.revenueCents += item.unitPriceCents * item.quantity;
    byProduct.set(item.productName, current);
  }
  const ranking = Array.from(byProduct.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const maxQuantity = ranking[0]?.quantity ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Faturamento (30 dias)"
          value={formatCents(totalCents)}
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          label="Pedidos (30 dias)"
          value={String(orders.length)}
          icon={Receipt}
          color="orange"
        />
        <StatCard
          label="Ticket médio"
          value={formatCents(averageTicketCents)}
          icon={TrendingUp}
          color="violet"
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="font-heading text-base font-medium text-white">
          Produtos mais vendidos
        </h2>
        <p className="text-sm text-muted-foreground">
          Por quantidade, nos últimos 30 dias.
        </p>

        <ol className="mt-4 flex flex-col gap-2.5">
          {ranking.map((product, index) => (
            <li key={product.name} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-right text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm text-white">{product.name}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {product.quantity}x ·{" "}
                    <span className="text-orange-300">
                      {formatCents(product.revenueCents)}
                    </span>
                  </p>
                </div>
                {/* Barra proporcional ao líder: dá a leitura de "quanto na
                    frente" sem precisar comparar números mentalmente. */}
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500"
                    style={{ width: `${(product.quantity / maxQuantity) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
