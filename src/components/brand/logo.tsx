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
  sizes = "128px",
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

// Medido direto na referência da Cakto que o usuário mandou: o ícone deles
// tem ~38px de altura contra ~34px da altura das letras de "cakto" — ícone
// e texto praticamente do mesmo tamanho (proporção ~1:1). Antes daqui o
// nosso ficava ~2:1 (ícone quase o dobro do texto), por isso destoava. Os
// tamanhos abaixo (junto com MARK_SIZE) fecham essa proporção pra ~1.2–1.5:1
// — não dá pra chegar em 1:1 exato porque o ícone deles é um glifo chapado
// de 2 cores (lê bem em qualquer tamanho); o nosso é uma ilustração
// detalhada do lobo, que perde legibilidade se encolher demais.
const WORDMARK_TEXT_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

export function LogoWordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
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

const MARK_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "size-6",
  md: "size-7",
  lg: "size-9",
};

// Lockup completo (símbolo + wordmark) usado em cabeçalhos e sidebars.
// `markOnly` renderiza só o símbolo — útil em espaços muito comprimidos
// (barra de abas mobile, avatar).
export function Logo({
  size = "md",
  markOnly = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  markOnly?: boolean;
  className?: string;
}) {
  if (markOnly) {
    return <LogoMark className={cn(MARK_SIZE[size], className)} />;
  }

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark className={MARK_SIZE[size]} />
      <LogoWordmark size={size} />
    </span>
  );
}
