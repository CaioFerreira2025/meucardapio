import type { Metadata } from "next";
import Link from "next/link";
import { Check, CreditCard, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanByOfferId } from "@/config/plans";
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
  past_due: "bg-orange-500/15 text-orange-300 ring-orange-500/25",
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

  const plan = getPlanByOfferId(subscription?.caktoOfferId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Cobrança
        </h1>
        <p className="text-muted-foreground">
          Veja o status da sua assinatura e gerencie o método de pagamento.
        </p>
      </div>

      <Card
        className={cn(
          "max-w-lg overflow-hidden",
          subscription?.status === "active" && "ring-1 ring-orange-500/30"
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400/20 to-rose-500/20 ring-1 ring-orange-500/20">
                <CreditCard className="size-4 text-orange-300" />
              </span>
              {plan?.name ?? "Nenhum plano ativo"}
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
          {plan && (
            <p className="text-3xl font-semibold tracking-tight text-white">
              {plan.price}
            </p>
          )}
        </CardHeader>
        {plan && (
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-orange-400" />
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
              className="gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-400 hover:to-rose-400"
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
