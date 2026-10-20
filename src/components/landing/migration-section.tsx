import Link from "next/link";
import { ArrowRight, LifeBuoy, PackageSearch, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";

// Seção curta de objeção — fica de propósito perto do fim da página,
// pouco antes dos planos: é exatamente o ponto em que quem já usa outro
// sistema hesita antes de seguir adiante. Diferente do Módulos Premium
// (iFood/Fiscal), migração de dados é um serviço que o time já consegue
// prestar de verdade hoje (mover cardápio e cadastro entre sistemas não
// depende de nenhuma integração externa), então aqui a copy pode afirmar
// o que fazemos, não só convidar para uma conversa.
const DEFAULT_WHATSAPP_NUMBER = "5516991408438";
const WHATSAPP_MESSAGE =
  "Olá! Já uso outro sistema e quero saber como funciona a migração para o Meu Restaurante.";

const POINTS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: PackageSearch, label: "Migração assistida do seu cardápio e cadastros" },
  { icon: LifeBuoy, label: "Time dedicado durante toda a troca" },
  { icon: Rocket, label: "Suas vendas continuam rodando enquanto migramos" },
];

export function MigrationSection() {
  const whatsappUrl = `https://wa.me/${DEFAULT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`;

  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 px-6 py-14 text-center sm:px-16">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="light-spot absolute inset-0" />
            </div>

            <div className="relative flex flex-col items-center gap-5">
              <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-300 uppercase ring-1 ring-brand-500/20">
                Já usa outro sistema?
              </span>
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Deixe a parte chata com a gente
              </h2>
              <p className="max-w-lg text-lg text-zinc-400">
                Nossa equipe migra seu cardápio, seus produtos e os
                cadastros do sistema antigo para o painel do Meu
                Restaurante — sem pausar suas vendas nem por um dia.
              </p>

              <RevealGroup
                className="mt-2 flex flex-col gap-3 text-left sm:flex-row sm:gap-6"
                stagger={0.1}
              >
                {POINTS.map((point) => (
                  <RevealItem key={point.label}>
                    <div className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <point.icon className="size-4 shrink-0 text-brand-300" />
                      {point.label}
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-base font-semibold text-white shadow-lg shadow-brand-800/30 hover:from-brand-400 hover:to-brand-300"
                  render={
                    <Link href={whatsappUrl} target="_blank" rel="noreferrer">
                      Falar com o Time de Migração
                      <ArrowRight className="size-4" />
                    </Link>
                  }
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
