import type { Metadata } from "next";

import { auth } from "@/auth";
import { pageTitle } from "@/config/brand";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PricingCards } from "@/components/billing/pricing-cards";

export const metadata: Metadata = {
  title: pageTitle("Planos"),
};

// Acessada tanto pelo link "Planos" da landing quanto de dentro do painel
// (Cobrança → Ver planos). Usa exatamente os mesmos componentes de
// header/footer/cards da "zona de marketing" escura — mesma tipografia,
// cores, bordas, espaçamento e animações da landing page, para quem
// navega do painel até aqui não sentir que trocou de sistema.
export default async function PricingPage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="dark flex min-h-screen flex-col bg-background">
      <LandingHeader isAuthenticated={isAuthenticated} />

      <main className="relative flex-1 pt-28 pb-24 sm:pt-36 sm:pb-32">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-brand-600/15 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(10,10,10)_75%)]" />
        </div>

        <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-6">
          <div className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-3 text-center">
            <span className="text-sm font-semibold tracking-wide text-brand-300 uppercase">
              Planos
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Escolha o plano ideal para o seu negócio
            </h1>
            <p className="text-lg text-zinc-400">
              Cancele quando quiser. Sem contrato de fidelidade, sem letras
              miúdas.
            </p>
          </div>

          <PricingCards isAuthenticated={isAuthenticated} />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
