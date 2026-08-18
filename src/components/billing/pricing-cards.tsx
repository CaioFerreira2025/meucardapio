"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";

import { CheckoutButton } from "@/components/billing/checkout-button";
import { RevealGroup, RevealItem } from "@/components/landing/reveal";
import { TiltCard } from "@/components/landing/tilt-card";
import {
  ANNUAL_PITCH,
  BILLING_CYCLES,
  DEFAULT_BILLING_CYCLE,
  PLANS,
  type BillingCycle,
} from "@/config/plans";
import { formatCents } from "@/lib/currency";
import { cn } from "@/lib/utils";

// Grid de planos compartilhado entre a seção da landing, a página /pricing e
// a tela de bloqueio por assinatura — mesmo componente nos três lugares, para
// preço e copy nunca divergirem entre onde o cliente vê e onde ele compra.
//
// O seletor de ciclo abre no ANUAL (ver DEFAULT_BILLING_CYCLE): é o plano que
// queremos vender, então ele é o que a pessoa vê primeiro, com os 30% já
// aplicados no número grande — em vez de exigir que ela descubra o desconto
// clicando. Mensal e trimestral seguem a um clique, sem esconder nada.
export function PricingCards({
  isAuthenticated,
  className,
}: {
  isAuthenticated: boolean;
  className?: string;
}) {
  const [cycle, setCycle] = useState<BillingCycle>(DEFAULT_BILLING_CYCLE);
  const isAnnual = cycle === "annual";

  return (
    <div className="flex flex-col gap-8">
      {/* Seletor de periodicidade */}
      <div className="flex flex-col items-center gap-4">
        <div
          role="radiogroup"
          aria-label="Periodicidade da assinatura"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1"
        >
          {BILLING_CYCLES.map((option) => {
            const active = option.key === cycle;
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={active}
                data-cycle={option.key}
                onClick={() => setCycle(option.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-600/25"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {option.label}
                {option.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-emerald-500/15 text-emerald-300"
                    )}
                  >
                    {option.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* A frase de incentivo só aparece no anual — é o argumento daquele
            ciclo, e mostrá-la sempre esvaziaria o peso dela. */}
        {isAnnual && (
          <p className="flex max-w-md items-center justify-center gap-2 text-center text-sm text-emerald-200/90">
            <Sparkles className="size-4 shrink-0 text-emerald-300" />
            {ANNUAL_PITCH}
          </p>
        )}
      </div>

      <RevealGroup className={cn("grid gap-6 sm:grid-cols-2 sm:items-start", className)}>
        {PLANS.map((plan) => {
          const price = plan.prices[cycle];
          const monthly = plan.prices.monthly;
          const savedPerYearCents =
            (monthly.monthlyEquivalentCents - price.monthlyEquivalentCents) * price.months;

          return (
            <RevealItem key={plan.id}>
              <TiltCard
                maxTilt={4}
                className={cn("group relative h-full", plan.highlighted && "sm:-translate-y-2")}
              >
                <div
                  data-slot="plan-card"
                  data-plan={plan.id}
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

                  {/* No anual, a etiqueta de economia substitui "Mais
                      escolhido": duas etiquetas competindo no mesmo canto
                      brigariam pela atenção e nenhuma seria lida. */}
                  {isAnnual ? (
                    <span className="absolute top-6 right-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[11px] font-semibold tracking-wide text-white uppercase shadow-md shadow-emerald-600/30">
                      Economize 30%
                    </span>
                  ) : (
                    plan.highlighted && (
                      <span className="absolute top-6 right-6 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-1 text-[11px] font-semibold tracking-wide text-white uppercase shadow-md shadow-orange-600/30">
                        Mais escolhido
                      </span>
                    )
                  )}

                  <div className="relative">
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{plan.description}</p>

                    {/* Preço riscado só quando existe desconto de verdade —
                        preço "de/por" no plano mensal seria falso. */}
                    {price.discountPercent > 0 && (
                      <p className="mt-5 text-sm text-zinc-500 line-through">
                        {formatCents(monthly.monthlyEquivalentCents)}/mês
                      </p>
                    )}

                    <p
                      className={cn(
                        "flex items-baseline gap-1",
                        price.discountPercent > 0 ? "mt-0.5" : "mt-5"
                      )}
                    >
                      <span
                        data-slot="plan-price"
                        className="text-4xl font-semibold tracking-tight text-white"
                      >
                        {formatCents(price.monthlyEquivalentCents)}
                      </span>
                      <span className="text-sm text-zinc-500">/mês</span>
                    </p>

                    <p className="mt-1.5 text-xs text-zinc-400">
                      {price.months === 1 ? (
                        "Cobrado mensalmente."
                      ) : (
                        <>
                          <span className="text-zinc-300">
                            {formatCents(price.totalCents)}
                          </span>{" "}
                          cobrados a cada {price.months} meses.
                        </>
                      )}
                    </p>

                    {savedPerYearCents > 0 && (
                      <p className="mt-2 inline-flex rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                        Você economiza {formatCents(savedPerYearCents)}
                      </p>
                    )}
                  </div>

                  <ul className="relative mt-6 flex flex-1 flex-col gap-2.5 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-zinc-300">
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
                    planId={plan.id}
                    cycle={cycle}
                    highlighted={Boolean(plan.highlighted)}
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
          );
        })}
      </RevealGroup>
    </div>
  );
}
