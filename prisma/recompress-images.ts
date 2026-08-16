// Recomprime fotos de produto já salvas no banco (uploads feitos ANTES da
// otimização de imagem — ver src/lib/uploads.ts). Uploads novos já saem
// comprimidos (WebP, até 960px) na hora do envio; este script é só para as
// fotos que já estavam no banco antes dessa mudança, que continuam do
// jeito que foram enviadas originalmente (às vezes vários MB direto em
// base64 no HTML do cardápio público — a maior causa de carregamento lento
// pelo QR Code).
//
// Só mexe na coluna `imageUrl` da tabela de produtos. Não apaga, não cria,
// não toca em nenhum outro dado — se a compressão de uma foto falhar por
// qualquer motivo, essa foto é pulada e continua exatamente como estava
// (nunca fica sem imagem por causa deste script).
//
// Uso:
//   node --experimental-strip-types prisma/recompress-images.ts
//   node --experimental-strip-types prisma/recompress-images.ts --dry-run   (só mostra o que faria, não grava nada)
import sharp from "sharp";

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

// Já processadas por este script (ou por um upload novo) viram
// "data:image/webp;..." — se já é webp e razoavelmente pequena, não vale a
// pena reprocessar (evita perda de qualidade por recomprimir a mesma
// imagem várias vezes à toa).
const ALREADY_OPTIMIZED_MAX_BYTES = 150 * 1024;

function isAlreadyOptimized(imageUrl: string): boolean {
  if (!imageUrl.startsWith("data:image/webp;base64,")) return false;
  const base64 = imageUrl.slice(imageUrl.indexOf(",") + 1);
  const approxBytes = Math.floor((base64.length * 3) / 4);
  return approxBytes <= ALREADY_OPTIMIZED_MAX_BYTES;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { imageUrl: { startsWith: "data:" } },
    select: { id: true, name: true, imageUrl: true },
  });

  const toProcess = products.filter(
    (p) => p.imageUrl && !isAlreadyOptimized(p.imageUrl)
  );

  console.log(
    `${products.length} produto(s) com foto em base64 no banco; ${toProcess.length} ainda não otimizada(s).`
  );
  if (DRY_RUN) console.log("(--dry-run: nada será gravado)\n");

  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let skipped = 0;

  for (const product of toProcess) {
    const imageUrl = product.imageUrl!;
    const commaIndex = imageUrl.indexOf(",");
    const meta = imageUrl.slice(5, commaIndex); // ex.: "image/jpeg;base64"
    const mimeType = meta.split(";")[0];
    const base64 = imageUrl.slice(commaIndex + 1);

    if (!mimeType.startsWith("image/")) {
      console.warn(`  pulando "${product.name}" (${product.id}): não parece imagem (${mimeType}).`);
      skipped++;
      continue;
    }

    try {
      const original = Buffer.from(base64, "base64");
      const compressed = await sharp(original)
        .rotate()
        .resize({ width: 960, withoutEnlargement: true })
        .webp({ quality: 72 })
        .toBuffer();

      totalBefore += original.length;
      totalAfter += compressed.length;
      processed++;

      const pct = (100 - (compressed.length / original.length) * 100).toFixed(0);
      console.log(
        `  ${product.name}: ${(original.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB (-${pct}%)`
      );

      if (!DRY_RUN) {
        const newImageUrl = `data:image/webp;base64,${compressed.toString("base64")}`;
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: newImageUrl },
        });
      }
    } catch (error) {
      console.warn(
        `  pulando "${product.name}" (${product.id}): falha ao comprimir (${String(error)}). Foto original mantida.`
      );
      skipped++;
    }
  }

  console.log(
    `\n${processed} foto(s) ${DRY_RUN ? "seriam recomprimidas" : "recomprimidas"}, ${skipped} pulada(s).`
  );
  if (processed > 0) {
    const savedMb = (totalBefore - totalAfter) / (1024 * 1024);
    const pct = (100 - (totalAfter / totalBefore) * 100).toFixed(0);
    console.log(
      `Peso total: ${(totalBefore / (1024 * 1024)).toFixed(1)}MB → ${(totalAfter / (1024 * 1024)).toFixed(1)}MB (-${pct}%, ${savedMb.toFixed(1)}MB a menos).`
    );
  }
}

main()
  .catch((error) => {
    console.error("Erro ao recomprimir imagens:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
