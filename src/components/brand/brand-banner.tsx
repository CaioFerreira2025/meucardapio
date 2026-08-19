import Image from "next/image";

import { cn } from "@/lib/utils";

// Faixa institucional da GreyPack (public/banner-greypack.webp) — a arte de
// divulgação da marca, exibida no painel do lojista, no painel
// administrativo e nas telas de login/cadastro.
//
// A arte original vinha com tarjas pretas mortas em cima e embaixo (1981×793
// com conteúdo só entre as linhas 154 e 654). Ela foi recortada na caixa real
// do conteúdo e reduzida para 1600px de largura: sem isso, o navegador
// baixaria ~1,4 MB e ainda desenharia duas faixas vazias que, dentro de um
// container arredondado, leem como "imagem desalinhada". Recortada e em WebP
// o arquivo tem 84 KB e a proporção fica 3,75:1, que encaixa certo na largura
// do conteúdo do painel.
//
// `h-auto w-full` + width/height intrínsecos: a faixa ocupa a largura
// disponível e a altura acompanha sozinha, então ela nunca estica nem corta
// em nenhuma tela. O `rounded-xl` + `border` repetem o mesmo acabamento dos
// cards do painel, para a faixa não parecer colada por cima da interface.
export function BrandBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <Image
        src="/banner-greypack.webp"
        alt="GreyPack — micro-SaaS sob medida para empresas que querem crescer"
        width={1600}
        height={426}
        quality={90}
        // A faixa nunca passa da largura do conteúdo do painel (~1100px);
        // pedir 1200px cobre telas de alta densidade sem baixar a arte
        // inteira à toa.
        sizes="(min-width: 768px) 1200px, 100vw"
        className="h-auto w-full"
      />
    </div>
  );
}
