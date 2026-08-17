import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { BRAND_NAME, BRAND_TAGLINE } from "@/config/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Cardápio digital para restaurantes`,
  description: BRAND_TAGLINE,
};

// Sem esse bloco, o Next.js emite só o viewport padrão
// (`width=device-width, initial-scale=1`) — e era essa a raiz de três
// problemas visuais no celular que nenhum ajuste de CSS resolvia:
//
// 1. `viewportFit: "cover"` — SEM isso, `env(safe-area-inset-bottom)`
//    resolve para 0px SEMPRE, em qualquer aparelho. Ou seja, todo o
//    tratamento de "área de segurança" da barra inferior do cardápio
//    (src/app/r/[slug]/menu-client.tsx) não fazia efeito nenhum, porque a
//    conta sempre dava zero. É o `cover` que faz o navegador desenhar a
//    página por baixo do notch/barra de gestos e, aí sim, expor os valores
//    reais dessas margens via env().
//
// 2. `interactiveWidget: "resizes-content"` — pede ao navegador para
//    ENCOLHER a área de layout quando o teclado virtual abre, em vez de
//    deixar o teclado cobrir a página por cima. É o que faz o modal de
//    checkout caber no espaço que sobra em vez de ficar cortado atrás do
//    teclado. Suportado no Chrome/Android; no Safari/iOS o suporte ainda é
//    inconsistente, por isso o checkout também tem um ajuste em JS via
//    Visual Viewport API (ver menu-client.tsx) — os dois se complementam.
//
// 3. `themeColor` — tinge a própria interface do navegador (barra de URL /
//    barra inferior do Safari) com a cor de fundo do app. Sem isso o Safari
//    deixa a barra dele translúcida mostrando o conteúdo da página por
//    trás, o que dava a impressão de que a barra de navegação do cardápio
//    estava "transparente" / com um vão vazando conteúdo embaixo dela.
//    `#0a0a0a` é o mesmo `--background` do tema escuro (globals.css) —
//    todas as telas do app (landing, painel e cardápio público) são
//    escuras, então vale uma cor só.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
