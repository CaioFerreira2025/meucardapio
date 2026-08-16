import Link from "next/link";

import { Reveal } from "@/components/landing/reveal";
import { PricingCards } from "@/components/billing/pricing-cards";

// Seção de planos da landing — mesmos 2 planos reais (Starter/Pro, ver
// src/config/plans.ts) que aparecem em /pricing, com o mesmo componente
// <PricingCards/>. Continua deixando claro que dá pra testar antes de
// assinar (cadastro grátis) sem inventar um "plano free" que não existe
// no sistema de cobrança.
export function PricingSection({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  return (
    <section className="relative bg-background py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/[0.07] blur-[130px]" />
      </div>

      <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-6">
        <Reveal className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="text-sm font-semibold tracking-wide text-orange-400 uppercase">
            Planos
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Escolha o plano ideal para o seu negócio
          </h2>
          <p className="text-lg text-zinc-400">
            Cadastre-se gratuitamente, monte seu cardápio e comece a
            receber pedidos. Assine quando quiser mais espaço para o seu
            negócio crescer.
          </p>
        </Reveal>

        <PricingCards isAuthenticated={isAuthenticated} />

        <p className="mt-8 text-center text-sm text-zinc-500">
          Quer ver todos os detalhes dos planos?{" "}
          <Link
            href="/pricing"
            className="font-medium text-orange-300 hover:text-orange-200"
          >
            Acesse a página de planos
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
