"use client";

import { HelpCircle, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PAGE_HELP, type PageHelpKey } from "@/config/page-help";

// Botão de ajuda que acompanha o título de cada aba do painel. Abre um modal
// curto explicando para que serve a tela e o que fazer nela.
//
// Escolhas de desenho, para não repetir a discussão depois:
//
// - É um botão discreto ao lado do título, e não um tour automático que
//   toma a tela na primeira visita. Quem já sabe usar não é interrompido
//   todo dia; quem está perdido acha a ajuda no lugar mais óbvio possível.
// - O conteúdo vem de src/config/page-help.ts, então revisar o texto de
//   todas as abas é abrir um arquivo só.
// - Os passos são numerados em vez de bullets porque a maioria das telas
//   tem uma ORDEM certa de fazer as coisas (criar categoria antes de
//   produto, abrir o caixa antes de vender), e número comunica isso sozinho.
export function PageHelp({ page }: { page: PageHelpKey }) {
  const help = PAGE_HELP[page];

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Como funciona a aba ${help.title}?`}
            title="Como funciona esta tela?"
            className="text-muted-foreground hover:text-brand-300"
          >
            <HelpCircle />
          </Button>
        }
      />
      <DialogContent className="flex max-h-[85dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="gap-1 p-5 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400/20 to-brand-500/20 ring-1 ring-brand-500/25">
              <HelpCircle className="size-4 text-brand-300" />
            </span>
            <DialogTitle className="text-white">{help.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-1">{help.intro}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-5">
          {help.steps.map((step, index) => (
            <div
              key={step.title}
              className="flex gap-3 rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/5"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-500 text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}

          {"tip" in help && help.tip && (
            <div className="flex gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5">
              <Lightbulb className="size-4 shrink-0 text-amber-300" />
              <p className="text-sm leading-relaxed text-amber-100/90">{help.tip}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
