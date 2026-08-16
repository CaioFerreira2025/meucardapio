"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "next-auth/react";
import {
  ClipboardList,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Smartphone,
  Star,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DarkPortalRoot } from "@/components/theme/dark-portal-root";
import { Logo } from "@/components/brand/logo";
import { stopImpersonation } from "@/app/admin/actions";

// `shortLabel` é usado só na barra de abas do mobile — com 7 itens agora
// (antes eram 5), "Visão geral" quebrava em duas linhas e ficava
// desalinhado com os outros. A sidebar do desktop continua usando `label`
// por inteiro, sem nenhuma mudança visual lá.
const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Visão geral",
    shortLabel: "Visão",
    icon: LayoutDashboard,
  },
  { href: "/dashboard/menu", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/dashboard/orders", label: "Pedidos", icon: ClipboardList },
  { href: "/dashboard/comanda", label: "Comanda", icon: Smartphone },
  { href: "/dashboard/caixa", label: "Caixa", icon: Wallet },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/reviews", label: "Avaliações", icon: Star },
  { href: "/dashboard/billing", label: "Cobrança", icon: CreditCard },
  { href: "/dashboard/settings", label: "Configurações", shortLabel: "Config.", icon: Settings },
];

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function initials(name?: string | null, email?: string | null) {
  const source = name ?? email ?? "?";
  return source
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Shell do painel: sidebar fixa no desktop, barra de abas fixa no mobile —
// o mesmo padrão "app premium" (Vercel, Linear, Stripe) usado por cima do
// tema escuro definido em .dark (globals.css). Recebe usuário/restaurante
// prontos do Server Component pai (layout.tsx) para não precisar buscar
// sessão de novo no client.
export function DashboardShell({
  user,
  restaurantSlug,
  isAdmin = false,
  isImpersonating = false,
  impersonatedRestaurantName,
  children,
}: {
  user: SessionUser;
  restaurantSlug: string;
  isAdmin?: boolean;
  isImpersonating?: boolean;
  impersonatedRestaurantName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleStopImpersonation() {
    startTransition(async () => {
      try {
        await stopImpersonation();
      } catch (error) {
        // `redirect()` na Server Action lança um erro especial do Next
        // (identificado pelo campo `digest`, não pela mensagem) pra
        // navegar — não é uma falha de verdade, deixa passar.
        const digest =
          error && typeof error === "object" && "digest" in error
            ? String((error as { digest?: unknown }).digest)
            : "";
        if (digest.startsWith("NEXT_REDIRECT")) {
          throw error;
        }
        toast.error(
          error instanceof Error ? error.message : "Erro ao sair do modo suporte."
        );
      }
    });
  }

  return (
    <DarkPortalRoot className="dark relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-[-15%] left-1/3 h-[32rem] w-[32rem] rounded-full bg-orange-600/10 blur-[130px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-96 w-96 rounded-full bg-rose-600/[0.07] blur-[120px]" />
      </div>

      {/* Faixa de "modo suporte" — só existe quando um administrador está
          operando o painel de um cliente (ver /admin). `fixed` (não
          `sticky`) e cobrindo a largura toda, por cima até da sidebar do
          desktop, pra nunca ficar ambíguo de quem é a conta que está sendo
          editada. Sidebar, topbar mobile e conteúdo abaixo compensam a
          altura fixa dela (h-10) quando ativa. */}
      {isImpersonating && (
        <div className="fixed inset-x-0 top-0 z-50 flex h-10 flex-wrap items-center justify-center gap-2 bg-violet-600 px-4 text-center text-sm font-medium text-white">
          <ShieldCheck className="size-4 shrink-0" />
          <span>
            Modo suporte: visualizando{" "}
            <strong>{impersonatedRestaurantName ?? "restaurante do cliente"}</strong>
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleStopImpersonation}
            className="ml-1 shrink-0 rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold transition-colors hover:bg-white/25 disabled:opacity-60"
          >
            {isPending ? "Saindo..." : "Sair do modo suporte"}
          </button>
        </div>
      )}
      {/* Espaçador em fluxo normal (a faixa acima é `fixed`, fora do
          fluxo) — empurra a topbar mobile (sticky) e o conteúdo pra baixo
          dos 2.5rem (h-10) da faixa; a sidebar desktop, por ser `fixed`,
          precisa do próprio ajuste (`top-10` acima) em vez de depender
          deste espaçador. */}
      {isImpersonating && <div className="h-10" />}

      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "fixed left-0 z-40 hidden w-60 flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl md:flex",
          isImpersonating ? "top-10 bottom-0" : "inset-y-0"
        )}
      >
        <Link
          href="/dashboard"
          className="flex h-16 shrink-0 items-center border-b border-border px-5"
        >
          <Logo size="sm" />
        </Link>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white",
                  isActive &&
                    "bg-gradient-to-r from-orange-500/15 to-rose-500/10 text-white ring-1 ring-orange-500/20"
                )}
              >
                <item.icon
                  className={cn("size-4", isActive && "text-orange-400")}
                  strokeWidth={2}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border p-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-violet-300 transition-colors hover:bg-white/5"
            >
              <ShieldCheck className="size-4" strokeWidth={2} />
              Painel Administrativo
            </Link>
          )}

          <Link
            href={`/r/${restaurantSlug}`}
            target="_blank"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-orange-300 transition-colors hover:bg-white/5"
          >
            <ExternalLink className="size-4" strokeWidth={2} />
            Ver cardápio público
          </Link>

          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <Avatar className="size-8 shrink-0 ring-1 ring-border">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
              <AvatarFallback className="bg-white/10 text-xs text-white">
                {initials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user.name ?? "Minha conta"}
              </p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Topbar — mobile */}
      <header
        className={cn(
          "sticky z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:hidden",
          isImpersonating ? "top-10" : "top-0"
        )}
      >
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-md p-2 text-violet-300 hover:bg-white/5"
              aria-label="Painel Administrativo"
            >
              <ShieldCheck className="size-4" />
            </Link>
          )}
          <Link
            href={`/r/${restaurantSlug}`}
            target="_blank"
            className="rounded-md p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
            aria-label="Ver cardápio público"
          >
            <ExternalLink className="size-4" />
          </Link>
          <Avatar className="size-7 ring-1 ring-border">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback className="bg-white/10 text-[10px] text-white">
              {initials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="relative flex min-h-screen flex-col md:pl-60">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* Barra de abas — mobile. Rolagem horizontal (em vez de `flex-1`
          dividindo a largura igualmente) porque agora são 7 abas — largura
          fixa por item mantém ícone+texto legíveis em qualquer tela, e dá
          pra chegar em todas as abas com um swipe em vez de espremer tudo.
          Sombra na borda direita sinaliza que dá pra rolar pra ver mais. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
        <nav className="relative flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-[4.5rem] shrink-0 flex-col items-center gap-1 py-2.5 text-[11px] font-medium whitespace-nowrap text-zinc-500 transition-colors",
                  isActive && "text-orange-400"
                )}
              >
                <item.icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
                {item.shortLabel ?? item.label}
              </Link>
            );
          })}
        </nav>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background/90 to-transparent"
        />
      </div>
    </DarkPortalRoot>
  );
}
