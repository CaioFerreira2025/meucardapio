import Image from "next/image";

import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/config/brand";

// Símbolo da marca: o lobo da GreyPack (public/favicon.png — mesmo arquivo
// usado como favicon, ver metadata.icons em src/app/layout.tsx). Antes era
// um glifo SVG geométrico (anel + ponto); trocado para essa ilustração
// raster fornecida pelo usuário.
//
// `fill` + `object-contain` em vez de width/height fixos: assim o mesmo
// componente serve tanto o ícone de 28px do header quanto a marca d'água
// gigante de 38rem no fundo do hero (ver hero-section.tsx) sem distorcer —
// quem controla o tamanho final é a classe `size-*` recebida em
// `className`, aplicada no `span` relativo que envolve a imagem (`fill`
// exige um ancestral com `position: relative`).
//
// `sizes` PRECISA refletir o tamanho real de cada uso — é ele que diz ao
// navegador qual imagem baixar do srcset gerado pelo Next. Um valor fixo
// aqui (ex.: sempre 192px) funciona bem pros ícones pequenos, mas fica
// pequeno demais pra marca d'água de 608px do hero: o navegador baixa uma
// versão de baixa resolução e estica pra caber no espaço, o que É a causa
// do serrilhado — não falta de resolução no arquivo-fonte (que está em
// 1024×1024), e `image-rendering` não resolveria isso porque essa
// propriedade afeta ampliação intencional de pixel art, não teria efeito
// aqui. Por isso `sizes` agora é uma prop, com um padrão generoso o
// bastante pros ícones de header/sidebar/avatar (até 40px, cobrindo telas
// de até 3x de densidade), e o hero passa o valor real do seu próprio
// tamanho. `quality={90}` (o padrão do Next é 75) porque a ilustração tem
// linhas finas de circuito sobre fundo quase preto — exatamente o tipo de
// detalhe que compressão mais agressiva borra primeiro.
export function LogoMark({
  className,
  sizes = "256px",
}: {
  className?: string;
  sizes?: string;
}) {
  return (
    <span className={cn("relative inline-block size-8 shrink-0", className)}>
      <Image
        src="/favicon.png"
        alt=""
        fill
        sizes={sizes}
        quality={90}
        className="object-contain"
      />
    </span>
  );
}

// Depois de comparar com a referência da Cakto num tamanho de renderização
// real (não só a proporção interna ícone:texto), o problema não era só a
// razão entre os dois — era que ambos estavam pequenos demais em termos
// absolutos. A tentativa anterior encolheu o ícone pra fechar a proporção
// e isso piorou a queixa do usuário ("o símbolo continua pequeno"). Agora:
// os dois tamanhos sobem juntos, com o ícone sempre maior que o texto (o
// usuário pediu explicitamente "o símbolo maior do lobo"), já que a
// ilustração detalhada do lobo (ao contrário do glifo chapado da Cakto)
// perde legibilidade se ficar pequena.
//
// `xl` é o tamanho do cabeçalho de marca das barras laterais do painel e do
// painel administrativo (ver dashboard-shell.tsx e admin-shell.tsx). Ele
// existe separado de propósito, em vez de simplesmente aumentar o `sm`: o
// `sm` também é usado no rodapé da landing e nas telas de login/cadastro, e
// o pedido aqui foi para dar destaque à marca DENTRO do painel, sem mexer
// no layout/design do site.
type LogoSize = "sm" | "md" | "lg" | "xl";

// sm/md/lg estão EXATAMENTE como já estão em produção e não devem ser
// alterados: eles servem o cabeçalho e o rodapé da landing, as telas de
// login/cadastro e a barra superior do celular. Mexer neles mudaria o
// layout do site, que é justamente o que não se quer aqui. Só o `xl`
// abaixo é novo, e ele é usado apenas nas barras laterais do painel.
const WORDMARK_TEXT_SIZE: Record<LogoSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-xl",
};

export function LogoWordmark({
  size = "md",
  className,
}: {
  size?: LogoSize;
  className?: string;
}) {
  return (
    // Token semântico (não cor fixa) — assim o mesmo componente funciona
    // tanto em fundo claro (login/cadastro) quanto escuro (painel, cardápio
    // público, landing, planos), sempre com contraste correto em cada um.
    <span
      className={cn(
        "font-semibold tracking-tight whitespace-nowrap text-foreground",
        WORDMARK_TEXT_SIZE[size],
        className
      )}
    >
      {BRAND_NAME}
    </span>
  );
}

// Mesma regra do WORDMARK_TEXT_SIZE acima: sm/md/lg intocados (são os do
// site), `xl` é o único novo e vive só no painel.
const MARK_SIZE: Record<LogoSize, string> = {
  sm: "size-6",
  md: "size-7",
  lg: "size-9",
  xl: "size-12",
};

// Lockup completo (símbolo + wordmark) usado em cabeçalhos e sidebars.
// `markOnly` renderiza só o símbolo — útil em espaços muito comprimidos
// (barra de abas mobile, avatar).
export function Logo({
  size = "md",
  markOnly = false,
  className,
}: {
  size?: LogoSize;
  markOnly?: boolean;
  className?: string;
}) {
  if (markOnly) {
    return <LogoMark className={cn(MARK_SIZE[size], className)} />;
  }

  return (
    <span
      className={cn(
        "flex items-center",
        // No `xl` (cabeçalho das barras laterais) o respiro entre símbolo e
        // nome é maior: com o símbolo a 48px, o gap de 8px do padrão fazia
        // os dois "colarem" e o conjunto lia como um bloco só, em vez de
        // símbolo + nome.
        size === "xl" ? "gap-2.5" : "gap-2",
        className
      )}
    >
      <LogoMark className={MARK_SIZE[size]} />
      <LogoWordmark size={size} />
    </span>
  );
}
