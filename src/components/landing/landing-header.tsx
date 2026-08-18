"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

// Header compartilhado por toda a "zona de marketing" escura: landing e
// /pricing (a página de planos, inclusive quando acessada de dentro do
// painel via Cobrança → Ver planos) — mesma identidade nas duas. Recebe se
// o usuário já está logado para trocar "Criar conta" por um atalho direto
// ao painel.
export function LandingHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>

        {isAuthenticated ? (
          <Button
            size="sm"
            className="rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-400 hover:to-brand-300"
            render={<Link href="/dashboard">Ir para o painel</Link>}
          />
        ) : (
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-300 hover:bg-white/10 hover:text-white"
              render={<Link href="/login">Entrar</Link>}
            />
            <Button
              size="sm"
              className="rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-400 hover:to-brand-300"
              render={<Link href="/register">Criar conta</Link>}
            />
          </nav>
        )}
      </div>
    </header>
  );
}
