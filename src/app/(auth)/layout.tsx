import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { BrandBanner } from "@/components/brand/brand-banner";

// Mesma identidade dark do resto do produto (Landing Page, painel,
// cardápio público — ver .dark em globals.css): fundo #0a0c0b, facho de
// luz suave em verde esmeralda, Card sólido em #101312. Login e Cadastro
// deixam de ser a única zona "clara" do fluxo.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark relative flex min-h-screen flex-col bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-[-15%] left-1/3 h-[32rem] w-[32rem] rounded-full bg-brand-600/10 blur-[130px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-96 w-96 rounded-full bg-rose-600/[0.07] blur-[120px]" />
      </div>

      <header className="relative flex h-14 items-center px-4 sm:px-6">
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </header>
      {/* A faixa institucional entra ABAIXO do formulário, nunca acima: quem
          chega aqui veio para entrar na conta, e empurrar o campo de e-mail
          para baixo da dobra por causa de uma peça de divulgação trocaria a
          tarefa principal por publicidade. `max-w-3xl` alinha a largura dela
          com a do Card de login em vez de esticar de ponta a ponta. */}
      <main className="relative flex flex-1 flex-col items-center justify-center gap-10 px-4 pb-16">
        {children}
        <BrandBanner className="w-full max-w-3xl" />
      </main>
    </div>
  );
}
