import type { Metadata } from "next";
import Link from "next/link";
import { Check, CreditCard, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanByOfferId, formatCycleLabel } from "@/config/plans";
import { formatCents } from "@/lib/currency";
import { pageTitle } from "@/config/brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CancelSubscriptionButton } from "@/components/billing/cancel-subscription-button";
import { PageHelp } from "@/components/dashboard/page-help";

export const metadata: Metadata = {
  title: pageTitle("Cobrança"),
};

const STATUS_LABEL: Record<string, string> = {
  trialing: "Em teste",
  active: "Ativa",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  unpaid: "Não paga",
  incomplete: "Incompleta",
  incomplete_expired: "Expirada",
  paused: "Pausada",
};

// Mesma lógica de "uma cor por estado" usada nos pedidos — deixa óbvio de
// relance se a assinatura está saudável ou precisa de atenção.
const STATUS_STYLE: Record<string, string> = {
  trialing: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
  active: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  past_due: "bg-brand-500/15 text-brand-300 ring-brand-500/25",
  canceled: "bg-white/10 text-zinc-400 ring-white/10",
  unpaid: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
  incomplete: "bg-white/10 text-zinc-400 ring-white/10",
  incomplete_expired: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
  paused: "bg-white/10 text-zinc-400 ring-white/10",
};

export default async function BillingPage() {
  const session = await auth();
  const subscription = session?.user?.id
    ? await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      })
    : null;

  const matched = getPlanByOfferId(subscription?.caktoOfferId);
  const plan = matched?.plan;
  const planPrice = matched?.price;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-1 text-2xl font-semibold tracking-tight text-white">
          Cobrança
          <PageHelp page="billing" />
        </h1>
        <p className="text-muted-foreground">
          Veja o status da sua assinatura e gerencie o método de pagamento.
        </p>
      </div>

      <Card
        className={cn(
          "max-w-lg overflow-hidden",
          subscription?.status === "active" && "ring-1 ring-brand-500/30"
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400/20 to-brand-500/20 ring-1 ring-brand-500/20">
                <CreditCard className="size-4 text-brand-300" />
              </span>
              {plan ? `${plan.name} · ${formatCycleLabel(planPrice!.cycle)}` : "Nenhum plano ativo"}
            </CardTitle>
            {subscription && (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                  STATUS_STYLE[subscription.status] ??
                    "bg-white/10 text-zinc-300 ring-white/10"
                )}
              >
                {STATUS_LABEL[subscription.status] ?? subscription.status}
              </span>
            )}
          </div>
          <CardDescription>
            {subscription
              ? subscription.cancelAtPeriodEnd
                ? `Sua assinatura será cancelada em ${subscription.currentPeriodEnd.toLocaleDateString("pt-BR")}.`
                : `Renova em ${subscription.currentPeriodEnd.toLocaleDateString("pt-BR")}.`
              : "Você ainda não tem uma assinatura ativa. Assine um plano para liberar todos os recursos do painel."}
          </CardDescription>
          {plan && planPrice && (
            <>
              <p className="text-3xl font-semibold tracking-tight text-white">
                {formatCents(planPrice.monthlyEquivalentCents)}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
              {/* Só faz sentido explicar a cobrança quando ela NÃO é mensal —
                  no mensal, "R$ 49/mês" já é literalmente o que sai do
                  cartão, e repetir isso seria ruído. */}
              {planPrice.months > 1 && (
                <p className="text-sm text-muted-foreground">
                  {formatCents(planPrice.totalCents)} cobrados a cada{" "}
                  {planPrice.months} meses.
                </p>
              )}
            </>
          )}
        </CardHeader>
        {plan && (
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-brand-300" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
        <CardFooter>
          {subscription && subscription.status !== "canceled" ? (
            <CancelSubscriptionButton />
          ) : (
            <Button
              className="gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-400 hover:to-brand-300"
              render={
                <Link href="/pricing">
                  <Sparkles className="size-4" />
                  Ver planos
                </Link>
              }
            />
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
