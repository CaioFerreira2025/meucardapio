"use client";

import { ClipboardList, Rocket, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";

const STEPS: Array<{
  icon: LucideIcon;
  step: string;
  title: string;
  description: string;
}> = [
  {
    icon: Rocket,
    step: "1",
    title: "Crie sua conta grátis",
    description:
      "Cadastre-se com email e senha e faça o onboarding do seu restaurante em menos de 2 minutos.",
  },
  {
    icon: UtensilsCrossed,
    step: "2",
    title: "Monte seu cardápio",
    description:
      "Adicione categorias, produtos, fotos e preços. Marque na hora o que ficou indisponível.",
  },
  {
    icon: ClipboardList,
    step: "3",
    title: "Comece a receber pedidos",
    description:
      "Compartilhe o link (ou o QR Code) do seu cardápio e acompanhe cada pedido em tempo real no painel.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Reveal className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="text-sm font-semibold tracking-wide text-brand-300 uppercase">
            Do zero ao primeiro pedido
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Em três passos simples
          </h2>
        </Reveal>

        <RevealGroup
          className="relative grid gap-8 sm:grid-cols-3"
          stagger={0.15}
        >
          <div
            aria-hidden
            className="absolute top-8 right-[16.5%] left-[16.5%] hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent sm:block"
          />
          {STEPS.map((item) => (
            <RevealItem key={item.step} className="relative flex flex-col items-center text-center">
              <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-600/20 to-brand-500/20 shadow-lg shadow-brand-900/30">
                <item.icon className="size-7 text-brand-300" strokeWidth={2} />
                <span className="absolute -top-2.5 -right-2.5 flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-500 text-xs font-bold text-white shadow-md">
                  {item.step}
                </span>
              </div>
              <h3 className="mb-1.5 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="max-w-xs text-sm text-zinc-400">
                {item.description}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
