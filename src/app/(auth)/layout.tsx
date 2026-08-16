import Link from "next/link";

import { Logo } from "@/components/brand/logo";

// Mesma identidade dark do resto do produto (Landing Page, painel,
// cardápio público — ver .dark em globals.css): fundo #0a0a0a, brilhos
// radiais sutis em laranja/rosa, Card sólido em #121212. Login e Cadastro
// deixam de ser a única zona "clara" do fluxo.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark relative flex min-h-screen flex-col bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-[-15%] left-1/3 h-[32rem] w-[32rem] rounded-full bg-orange-600/10 blur-[130px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-96 w-96 rounded-full bg-rose-600/[0.07] blur-[120px]" />
      </div>

      <header className="relative flex h-14 items-center px-4 sm:px-6">
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
