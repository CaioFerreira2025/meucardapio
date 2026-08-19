import Image from "next/image";

import { cn } from "@/lib/utils";

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
// `mobile` é o lockup das barras superiores de celular (cabeçalho da landing
// e topo do painel). Ele existe porque nessas barras a largura é disputada
// com botões, e a saída não é encolher o lobo: o lettering "GREYPACK" é que
// é largo (proporção 8:1), então trocar 2px de altura de letra por 12px de
// símbolo deixa o lobo 50% maior e o conjunto até 4px MAIS ESTREITO que
// antes — cabe melhor e o lobo aparece.
type LogoSize = "sm" | "mobile" | "md" | "lg" | "xl";

// O wordmark deixou de ser texto ("Meu Restaurante" numa fonte do sistema)
// e passou a ser a arte do logotipo GreyPack (public/wordmark.png) —
// lettering próprio, com o degradê metálico em "GREY" e o verde da marca em
// "PACK", que nenhuma font-family conseguiria reproduzir.
//
// A arte foi recortada com fundo transparente a partir do PNG enviado: o
// canvas preto original virou alfa (máscara por luminância), as manchas
// soltas do fundo foram removidas e a imagem foi cortada na caixa exata do
// lettering. Assim ela assenta em qualquer fundo — escuro (painel, landing,
// login) ou claro — sem moldura nem halo.
//
// Como é imagem e não texto, o controle de tamanho é a ALTURA (a largura
// acompanha sozinha via `w-auto`, preservando a proporção de 8.08:1 do
// arquivo). Os valores abaixo dão a mesma presença visual que os tamanhos
// de fonte que existiam antes, para não mexer no layout de nenhuma tela:
// sm ≈129px de largura, md ≈162px, lg ≈226px, xl ≈145px.
const WORDMARK_HEIGHT: Record<LogoSize, string> = {
  sm: "h-4",
  // 14px de altura ≈ 113px de largura. Com o símbolo de 36px e 8px de
  // espaço, o lockup fecha em 157px — contra 161px do `sm` que estava aqui.
  mobile: "h-3.5",
  md: "h-5",
  lg: "h-7",
  // xl vive na barra lateral do painel (largura útil de 224px): 48px de
  // símbolo + 10px de espaço + 145px de lettering = 203px, com folga até a
  // borda. Subir para h-5 (162px) encostaria na margem direita.
  xl: "h-[18px]",
};

export function LogoWordmark({
  size = "md",
  className,
}: {
  size?: LogoSize;
  className?: string;
}) {
  return (
    <Image
      src="/wordmark.png"
      // O alt descreve o que a imagem mostra (o logotipo), não o nome
      // interno da plataforma — é isso que um leitor de tela deve anunciar.
      alt="GreyPack"
      width={622}
      height={77}
      quality={90}
      // Pede sempre a arte perto do tamanho nativo (622px): o lettering tem
      // contorno fino e degradê, e é exibido no máximo a ~226px, o que em
      // tela de 3x dá 678px. Servir menos que isso serrilharia as bordas.
      sizes="640px"
      className={cn("w-auto shrink-0", WORDMARK_HEIGHT[size], className)}
    />
  );
}

// A proporção que importa aqui é símbolo ÷ altura do lettering, e ela vinha
// muito diferente entre o painel e as páginas públicas: no `xl` da barra
// lateral dava 48÷18 ≈ 2,7, enquanto no `md` do site dava 28÷20 = 1,4. Como
// o lettering "GREYPACK" é largo (8:1), com um símbolo de 28px o lobo
// simplesmente sumia ao lado das letras — é exatamente a diferença que
// aparece comparando o cabeçalho do site com a barra lateral do painel.
//
// `md` sobe de 28px para 44px de símbolo, mantendo o lettering nos mesmos
// 20px — só o lobo cresce, que era exatamente o pedido. 44px é o teto para
// esta faixa: o cabeçalho da landing tem 64px de altura e continua com essa
// altura, então acima de 44px o símbolo encostaria nas bordas. `sm` fica
// como está: ele serve o rodapé da landing e a barra superior do celular
// (h-14 = 56px), onde um símbolo grande não caberia.
const MARK_SIZE: Record<LogoSize, string> = {
  sm: "size-6",
  // 36px: cabe com folga nas barras de 56px de altura do celular e é 50%
  // maior que os 24px que o celular usava antes.
  mobile: "size-9",
  md: "size-11",
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
