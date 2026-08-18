import Link from "next/link";
import { ArrowRight, Check, QrCode, Store, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OnboardingProgress = {
  /** Identidade preenchida: logo, telefone/WhatsApp e descrição. */
  identityDone: boolean;
  /** Pelo menos uma categoria com pelo menos um produto. */
  menuDone: boolean;
  /** Pelo menos um pedido recebido — prova de que o cardápio circulou. */
  sharedDone: boolean;
};

// Guia de primeiros passos da Visão Geral.
//
// Duas decisões importantes:
//
// 1. Os passos são verificados de verdade contra o banco (ver
//    getOnboardingProgress em src/lib/onboarding-progress.ts), não marcados
//    com um clique de "já fiz". Checklist que a pessoa marca sozinha vira
//    mentira em uma semana e deixa de ser útil como diagnóstico.
// 2. O bloco INTEIRO desaparece quando os três passos estão completos. Um
//    checklist 100% concluído ocupando o topo da tela mais usada do sistema
//    é ruído permanente — ele cumpriu o papel e deve sair de cena.
export function OnboardingChecklist({
  progress,
  restaurantSlug,
}: {
  progress: OnboardingProgress;
  restaurantSlug: string;
}) {
  const steps = [
    {
      done: progress.identityDone,
      icon: Store,
      title: "Configure a identidade da sua loja",
      description:
        "Logo, WhatsApp e uma descrição curta — é o topo do seu cardápio digital.",
      href: "/dashboard/settings",
      cta: "Configurar",
    },
    {
      done: progress.menuDone,
      icon: UtensilsCrossed,
      title: "Monte seu cardápio",
      description:
        "Crie a primeira categoria e cadastre pelo menos um produto com foto e preço.",
      href: "/dashboard/menu",
      cta: "Criar cardápio",
    },
    {
      done: progress.sharedDone,
      icon: QrCode,
      title: "Divulgue e receba o primeiro pedido",
      description:
        "Imprima o QR Code, coloque nas mesas e compartilhe o link com seus clientes.",
      href: `/r/${restaurantSlug}`,
      cta: "Ver cardápio",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;

  // O próximo passo pendente ganha destaque; os demais ficam discretos, para
  // a pessoa não olhar três chamadas de ação ao mesmo tempo e travar.
  const nextIndex = steps.findIndex((s) => !s.done);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-card p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-brand-500/10 blur-[90px]"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-medium text-white">
            Primeiros passos para sua loja faturar
          </h2>
          <p className="text-sm text-muted-foreground">
            Faltam {steps.length - completed} de {steps.length} para o cardápio
            estar rodando.
          </p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-brand-200 ring-1 ring-brand-500/20">
          {completed}/{steps.length} concluídos
        </span>
      </div>

      {/* Barra de progresso: leitura instantânea de "quanto falta", sem
          precisar contar os checks um a um. */}
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-500"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>

      <ol className="relative mt-4 flex flex-col gap-2">
        {steps.map((step, index) => {
          const isNext = index === nextIndex;
          return (
            <li
              key={step.title}
              className={cn(
                "flex flex-col gap-3 rounded-xl p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between",
                step.done
                  ? "bg-white/[0.02] ring-1 ring-white/5"
                  : isNext
                    ? "bg-brand-500/[0.06] ring-1 ring-brand-500/25"
                    : "bg-white/[0.02] ring-1 ring-white/5"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full ring-1",
                    step.done
                      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                      : isNext
                        ? "bg-gradient-to-br from-brand-600 to-brand-500 text-white ring-brand-500/30"
                        : "bg-white/5 text-muted-foreground ring-white/10"
                  )}
                >
                  {step.done ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    <step.icon className="size-3.5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.done ? "text-muted-foreground line-through" : "text-white"
                    )}
                  >
                    {step.title}
                  </p>
                  {!step.done && (
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  )}
                </div>
              </div>

              {!step.done && (
                <Button
                  size="sm"
                  variant={isNext ? "default" : "outline"}
                  className={cn(
                    "shrink-0 gap-1.5",
                    isNext &&
                      "bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-400 hover:to-brand-300"
                  )}
                  render={
                    <Link href={step.href}>
                      {step.cta}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  }
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
