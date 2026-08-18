import type { Metadata } from "next";
import { Users, Wallet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getPlanByOfferId } from "@/config/plans";
import { formatCents } from "@/lib/currency";
import { pageTitle } from "@/config/brand";
import { StatCard } from "@/components/dashboard/stat-card";
import { SubscribersTable } from "@/components/admin/subscribers-table";
import { RestaurantModules } from "@/components/admin/restaurant-modules";
import { MODULES } from "@/modules/registry";

export const metadata: Metadata = {
  title: pageTitle("Painel Administrativo"),
};

// Assinante "ativo" pra fins de contagem/MRR = assinatura em `active`.
// `trialing` ainda não gerou cobrança de verdade, então entra na tabela
// (a equipe precisa ver quem está em teste) mas não soma no MRR nem no
// contador de assinantes — é a definição convencional de MRR.
const PAYING_STATUSES = new Set(["active"]);

export default async function AdminPage() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        include: { subscription: true },
      },
      modules: { select: { moduleKey: true } },
    },
  });

  // Só o que o client component precisa saber do registro (sem a função
  // `load`, que não é serializável para o cliente).
  const moduleOptions = MODULES.map((m) => ({
    key: m.key,
    name: m.name,
    description: m.description,
  }));

  const subscribers = restaurants.map((restaurant) => {
    const subscription = restaurant.owner.subscription;
    const plan = getPlanByOfferId(subscription?.caktoOfferId);
    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      ownerName: restaurant.owner.name,
      ownerEmail: restaurant.owner.email,
      whatsapp: restaurant.phone,
      planName: plan?.name ?? null,
      priceCents: plan?.priceCents ?? null,
      status: subscription?.status ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    };
  });

  const totalAssinantes = subscribers.filter(
    (s) => s.status && PAYING_STATUSES.has(s.status)
  ).length;

  const mrrCents = subscribers.reduce((sum, s) => {
    if (s.status && PAYING_STATUSES.has(s.status) && s.priceCents) {
      return sum + s.priceCents;
    }
    return sum;
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground">
          Todos os restaurantes assinantes do sistema, em um só lugar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total de Assinantes"
          value={String(totalAssinantes)}
          icon={Users}
          color="orange"
        />
        <StatCard
          label="Receita Mensal Recorrente (MRR)"
          value={formatCents(mrrCents)}
          icon={Wallet}
          color="emerald"
        />
      </div>

      <SubscribersTable subscribers={subscribers} />

      {/* Módulos sob demanda: liga/desliga por cliente, conforme o combinado
          comercial. Ver src/modules/registry.ts para criar módulos novos. */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Módulos sob demanda
          </h2>
          <p className="text-sm text-muted-foreground">
            Ferramentas extras liberadas cliente a cliente. Quem não tem o
            módulo ligado nem carrega o código dele.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">{restaurant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {restaurant.owner.email}
                </p>
              </div>
              <RestaurantModules
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                modules={moduleOptions}
                enabledKeys={restaurant.modules.map((m) => m.moduleKey)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
