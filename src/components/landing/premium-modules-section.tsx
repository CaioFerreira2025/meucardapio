import Link from "next/link";
import { ArrowRight, Receipt, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";

// Seção "Módulos Premium" — iFood e Fiscal.
//
// Importante: nenhum dos dois módulos tem hoje uma integração de verdade
// no produto (nenhuma chamada à API do iFood, nenhuma emissão real de
// NFC-e/NF-e — ver os comentários em IfoodIntegrationCard.tsx e
// NfeIntegrationCard.tsx, que são upsell puro). Por isso a copy aqui NUNCA
// afirma "nós integramos com o iFood" ou "emitimos nota fiscal" no
// presente, como fato já entregue — ela convida para uma conversa
// ("avaliar", "consultar", "falar com consultor"). Se um dia a
// implantação real existir, dá pra deixar a copy mais afirmativa; até lá,
// prometer o que o produto não faz é o tipo de risco que já discutimos
// para a tela de Configurações.
const DEFAULT_WHATSAPP_NUMBER = "5516991408438";

interface ModuleCard {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  ctaLabel: string;
  whatsappMessage: string;
}

const MODULES: ModuleCard[] = [
  {
    icon: ShoppingBag,
    eyebrow: "Módulo iFood",
    title: "Centralize os canais de venda do seu jeito",
    body: "O cardápio digital próprio já vem no plano base, sem comissão. Se quiser somar o iFood no mesmo painel, um consultor avalia com você o que é possível para o seu CNPJ e o seu volume de pedidos antes de qualquer contratação.",
    bullets: [
      "Conversa com um consultor para entender o que é possível no seu caso",
      "Escopo e prazo combinados antes de qualquer compromisso",
      "Você decide: cardápio próprio, iFood, ou os dois",
    ],
    ctaLabel: "Falar com Consultor",
    whatsappMessage:
      "Olá! Quero saber mais sobre o Módulo iFood do Meu Restaurante.",
  },
  {
    icon: Receipt,
    eyebrow: "Módulo Fiscal",
    title: "Organize nota fiscal e tributos com apoio especializado",
    body: "Fale com nosso time sobre emissão de NFC-e/NF-e e sobre como enquadrar sua operação dentro da legislação. A implantação é avaliada caso a caso, com acompanhamento de especialista — não é um robô genérico.",
    bullets: [
      "Diagnóstico do seu regime tributário com um especialista",
      "Plano de implantação combinado antes de qualquer contratação",
      "Acompanhamento dedicado durante todo o processo",
    ],
    ctaLabel: "Consultar Disponibilidade",
    whatsappMessage:
      "Olá! Quero saber mais sobre o Módulo Fiscal (NFC-e/NF-e) do Meu Restaurante.",
  },
];

export function PremiumModulesSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="light-spot absolute inset-0" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-300 uppercase ring-1 ring-brand-500/20">
              Módulos Premium · Sob consulta
            </span>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Quando seu restaurante estiver pronto para ir além
            </h2>
            <p className="max-w-2xl text-lg text-zinc-400">
              O plano base já traz PDV, painel e cardápio digital sem
              comissão. Para operações mais complexas — iFood e a parte
              fiscal — nosso time de consultores avalia com você o seu
              CNPJ e o seu modelo de negócio antes de qualquer implantação.
            </p>
          </div>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-6 lg:grid-cols-2" stagger={0.1}>
          {MODULES.map((module) => {
            const whatsappUrl = `https://wa.me/${DEFAULT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
              module.whatsappMessage
            )}`;

            return (
              <RevealItem key={module.eyebrow}>
                <div className="flex h-full flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                  <div className="flex flex-col gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400/20 to-brand-500/20 ring-1 ring-brand-500/25">
                      <module.icon className="size-5 text-brand-300" strokeWidth={2} />
                    </span>
                    <p className="text-xs font-semibold tracking-wide text-brand-300 uppercase">
                      {module.eyebrow}
                    </p>
                    <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      {module.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      {module.body}
                    </p>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {module.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-sm text-zinc-300">
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-brand-300" />
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <Button
                    size="lg"
                    className="mt-auto h-12 w-fit gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-base font-semibold text-white shadow-lg shadow-brand-900/50 ring-1 ring-brand-300/20 hover:from-brand-500 hover:to-brand-400 hover:shadow-brand-700/50"
                    render={
                      <Link href={whatsappUrl} target="_blank" rel="noreferrer">
                        {module.ctaLabel}
                        <ArrowRight className="size-4" />
                      </Link>
                    }
                  />
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Atendimento feito por gente de verdade — nenhum desses módulos é
          ativado sem uma conversa antes com nosso time.
        </p>
      </div>
    </section>
  );
}
