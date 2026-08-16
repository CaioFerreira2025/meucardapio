import type { Metadata } from "next";
import { Users, Wallet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getPlanByPriceId } from "@/config/plans";
import { formatCents } from "@/lib/currency";
import { pageTitle } from "@/config/brand";
import { StatCard } from "@/components/dashboard/stat-card";
import { SubscribersTable } from "@/components/admin/subscribers-table";

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
    },
  });

  const subscribers = restaurants.map((restaurant) => {
    const subscription = restaurant.owner.subscription;
    const plan = getPlanByPriceId(subscription?.stripePriceId);
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
    </div>
  );
}
