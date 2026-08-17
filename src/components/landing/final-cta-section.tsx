"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { PLANS } from "@/config/plans";
import { DEMO_RESTAURANT_SLUG } from "@/config/brand";

// Preço do plano mais barato, usado no texto "a partir de" abaixo — lido
// direto de PLANS (mesma fonte usada pelos cards de planos) em vez de um
// valor fixo no meio da frase, pra nunca ficar dessincronizado quando o
// preço de algum plano mudar em src/config/plans.ts.
const cheapestPlan = [...PLANS].sort((a, b) => a.priceCents - b.priceCents)[0];

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-background pb-24 sm:pb-32">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 px-6 py-16 text-center shadow-2xl sm:px-16">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute top-[-30%] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-orange-600/25 blur-[110px]" />
              <div className="absolute right-[-10%] bottom-[-30%] h-72 w-72 rounded-full bg-rose-600/20 blur-[100px]" />
            </div>

            <div className="relative flex flex-col items-center gap-5">
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Pronto para modernizar o cardápio do seu restaurante?
              </h2>
              <p className="max-w-lg text-lg text-zinc-400">
                Crie sua conta grátis agora e monte seu cardápio digital em
                minutos. Planos pagos a partir de{" "}
                <span className="text-zinc-300">{cheapestPlan.price}</span>{" "}
                quando você quiser desbloquear mais recursos.
              </p>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 text-base font-semibold text-white shadow-lg shadow-orange-600/30 hover:from-orange-400 hover:to-rose-400"
                  render={
                    <Link href="/register">
                      Criar Conta Grátis
                      <ArrowRight className="size-4" />
                    </Link>
                  }
                />
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-white/20 bg-white/5 px-6 text-base text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
                  render={
                    <Link
                      href={`/r/${DEMO_RESTAURANT_SLUG}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver Cardápio de Demonstração
                    </Link>
                  }
                />
              </div>
              <p className="text-xs text-zinc-500">
                Sem cartão de crédito para começar.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
