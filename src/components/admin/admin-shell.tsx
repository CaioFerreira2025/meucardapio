"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DarkPortalRoot } from "@/components/theme/dark-portal-root";
import { Logo } from "@/components/brand/logo";

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

// Shell próprio do Painel Administrativo — mesma paleta escura/laranja do
// resto do sistema (padrão visual único, "parte nativa"), mas
// deliberadamente separado do DashboardShell: este painel não pertence a
// um restaurante, então não faz sentido herdar a sidebar/nav baseada em
// `restaurantSlug`. Só o administrador (verificado no layout.tsx) chega
// aqui.
export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <DarkPortalRoot className="dark relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-[-15%] left-1/3 h-[32rem] w-[32rem] rounded-full bg-brand-600/10 blur-[130px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-96 w-96 rounded-full bg-rose-600/[0.07] blur-[120px]" />
      </div>

      {/* h-20 (era h-16) pelo mesmo motivo da barra lateral do painel: o
          símbolo passou para 48px e precisava de altura para respirar. */}
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/admin">
            <Logo size="xl" />
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/25 sm:flex">
            <ShieldCheck className="size-3.5" />
            Painel Administrativo
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-white">
              {user.name ?? "Administrador"}
            </p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
          <Avatar className="size-8 shrink-0 ring-1 ring-border">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback className="bg-white/10 text-xs text-white">
              {initials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="shrink-0 rounded-md p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </DarkPortalRoot>
  );
}
