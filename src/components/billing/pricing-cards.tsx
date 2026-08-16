"use client";

import { Check } from "lucide-react";

import { CheckoutButton } from "@/components/billing/checkout-button";
import { RevealGroup, RevealItem } from "@/components/landing/reveal";
import { TiltCard } from "@/components/landing/tilt-card";
import { PLANS } from "@/config/plans";
import { cn } from "@/lib/utils";

// Grid de planos compartilhado entre a seção de planos da landing e a
// página /pricing (acessada de dentro do painel via Cobrança → Ver
// planos) — mesmo componente, mesma identidade visual nos dois lugares,
// então navegar entre eles nunca parece "trocar de sistema". Os dados
// (preços, features) vêm de src/config/plans.ts e nunca são inventados
// aqui — só 2 planos existem de verdade: Starter e Pro.
export function PricingCards({
  isAuthenticated,
  className,
}: {
  isAuthenticated: boolean;
  className?: string;
}) {
  return (
    <RevealGroup
      className={cn(
        "grid gap-6 sm:grid-cols-2 sm:items-start",
        className
      )}
    >
      {PLANS.map((plan) => (
        <RevealItem key={plan.id}>
          <TiltCard
            maxTilt={4}
            className={cn(
              "group relative h-full",
              plan.highlighted && "sm:-translate-y-2"
            )}
          >
            <div
              className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-2xl border p-7 backdrop-blur-sm transition-colors",
                plan.highlighted
                  ? "border-orange-500/40 bg-gradient-to-b from-orange-500/[0.08] to-white/[0.02] shadow-2xl shadow-orange-950/40"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
              )}
            >
              {plan.highlighted && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-orange-500/20 blur-[90px]"
                />
              )}

              {plan.highlighted && (
                <span className="absolute top-6 right-6 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-1 text-[11px] font-semibold tracking-wide text-white uppercase shadow-md shadow-orange-600/30">
                  Mais escolhido
                </span>
              )}

              <div className="relative">
                <h3 className="text-lg font-semibold text-white">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {plan.description}
                </p>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-white">
                    {plan.price.split("/")[0]}
                  </span>
                  <span className="text-sm text-zinc-500">
                    /{plan.price.split("/")[1] ?? "mês"}
                  </span>
                </p>
              </div>

              <ul className="relative mt-6 flex flex-1 flex-col gap-2.5 text-sm">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-zinc-300"
                  >
                    <span
                      className={cn(
                        "flex size-4.5 shrink-0 items-center justify-center rounded-full",
                        plan.highlighted
                          ? "bg-orange-500/20 text-orange-300"
                          : "bg-white/10 text-zinc-300"
                      )}
                    >
                      <Check className="size-3" strokeWidth={2.5} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <CheckoutButton
                plan={plan}
                isAuthenticated={isAuthenticated}
                className={cn(
                  "relative mt-7 h-11 rounded-xl font-semibold",
                  plan.highlighted
                    ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-600/30 hover:from-orange-400 hover:to-rose-400"
                    : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                )}
              />
            </div>
          </TiltCard>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
