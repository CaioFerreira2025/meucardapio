import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { BRAND_NAME } from "@/config/brand";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-background py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:text-left sm:px-6">
        <Link href="/">
          <Logo size="sm" />
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-400">
          <Link href="/pricing" className="hover:text-white">
            Planos
          </Link>
          <Link href="/login" className="hover:text-white">
            Entrar
          </Link>
          <Link href="/register" className="hover:text-white">
            Criar conta
          </Link>
          <Link
            href="/r/lanchonete-do-joao"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white"
          >
            Cardápio de demonstração
          </Link>
        </nav>

        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} {BRAND_NAME}. Cardápio digital para
          restaurantes.
        </p>
      </div>
    </footer>
  );
}
