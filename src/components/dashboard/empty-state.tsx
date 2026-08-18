import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Estado vazio padrão de todo o painel.
//
// Existe como componente único (e não como markup repetido em cada página)
// por dois motivos: consistência — antes cada tela tinha sua própria caixa
// tracejada, com espaçamentos e tons ligeiramente diferentes — e porque
// tela vazia é a PRIMEIRA coisa que todo lojista novo vê. É onde ele decide
// se o produto parece cuidado ou abandonado, então vale um componente que
// carrega o acabamento (brilho âmbar, ícone em destaque, ação óbvia) de
// graça para quem usar.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Ação principal. `href` navega; `onClick` fica a cargo de quem chama. */
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  /** Espaço para uma ação que precise de client component (ex.: abrir modal). */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        // O brilho difuso atrás do ícone é o que separa "caixa cinza" de
        // "tela pensada" — mesmo tratamento do card de plano em destaque e
        // do painel flutuante do cardápio público.
        "relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-card p-10 text-center",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-brand-500/10 blur-[80px]"
      />

      <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400/20 to-brand-500/20 ring-1 ring-brand-500/25">
        <Icon className="size-6 text-brand-300" />
      </span>

      <div className="relative flex max-w-md flex-col gap-1.5">
        <h3 className="font-heading text-base font-medium text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      {(action || secondaryAction || children) && (
        <div className="relative mt-1 flex flex-col items-center gap-2 sm:flex-row">
          {action && (
            <Button
              className="gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-800/20 hover:from-brand-400 hover:to-brand-300"
              render={<Link href={action.href}>{action.label}</Link>}
            />
          )}
          {children}
          {secondaryAction && (
            <Button
              variant="outline"
              render={<Link href={secondaryAction.href}>{secondaryAction.label}</Link>}
            />
          )}
        </div>
      )}
    </div>
  );
}
