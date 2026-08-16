import path from "node:path";
import sharp from "sharp";

import { MAX_UPLOAD_BYTES } from "@/lib/uploads-shared";

// Imagem de produto guardada como data URL (base64) direto na coluna
// `imageUrl` do banco — nada é escrito em disco.
//
// Por quê: a primeira versão salvava os arquivos em disco (fora de
// `public/`, servidos por uma rota dinâmica — ver o histórico dessa rota
// em src/app/api/uploads/products/[restaurantId]/[filename]/route.ts) e
// isso funcionou nos nossos testes, mas se mostrou frágil em condições que
// não conseguimos reproduzir/depurar remotamente (build de produção
// desatualizado, particularidades do filesystem/permissões do host, etc.):
// o resultado, na prática, era a foto sumir no cardápio público. Guardar a
// imagem como base64 direto no banco elimina essa classe inteira de
// problema — não depende de escrita em disco, de uma rota separada estar
// no ar, nem de reiniciar o servidor depois do upload. A imagem sempre
// aparece, porque ela É o HTML da página, não um link para outro lugar.
//
// Trade-off consciente: cada produto com foto deixa a página do cardápio
// público mais pesada (a imagem vai embutida no HTML, sem cache HTTP
// próprio). Para um cardápio de restaurante/lanchonete (dezenas de
// produtos, não milhares) isso é um preço baixo pela confiabilidade. Se o
// cardápio crescer muito ou a página começar a pesar, troque esta função
// por um provedor de object storage (Vercel Blob, S3, Cloudflare R2,
// Cloudinary, UploadThing...) — a assinatura pode continuar a mesma, só o
// corpo de `saveProductImage` muda para fazer upload ao provedor e
// devolver a URL dele.

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type SaveImageResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function saveProductImage(
  _restaurantId: string,
  file: File
): Promise<SaveImageResult> {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return { success: false, error: "Formato inválido. Use JPG, PNG ou WebP." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { success: false, error: "Imagem muito grande (máx. 1,5MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Comprime e redimensiona antes de guardar como data URL — como a foto
  // vai embutida direto no HTML do cardápio público (comentário acima),
  // o tamanho dela pesa direto na velocidade de carregamento pelo QR Code
  // no salão. Reduzir para no máximo 960px de largura e reencodar em WebP
  // costuma cortar 80-95% do peso de uma foto tirada de celular, sem perda
  // perceptível — o card do produto no cardápio renderiza a imagem bem
  // menor que isso. Se a compressão falhar por qualquer motivo (formato
  // inesperado, etc.), cai para o arquivo original: nunca deixa o upload
  // quebrar por causa disso (mesma filosofia de confiabilidade acima).
  try {
    const compressed = await sharp(buffer)
      .rotate() // aplica a orientação do EXIF antes de descartá-lo
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();

    return {
      success: true,
      url: `data:image/webp;base64,${compressed.toString("base64")}`,
    };
  } catch {
    const base64 = buffer.toString("base64");
    return { success: true, url: `data:${file.type};base64,${base64}` };
  }
}

// --- Compatibilidade com a versão antiga (armazenamento em disco) -------
// As funções abaixo só existem para continuar servindo imagens que já
// tinham sido enviadas antes dessa mudança (URLs no formato
// `/api/uploads/products/<restaurantId>/<arquivo>`, salvas em disco). Novos
// uploads não passam mais por aqui — ver `saveProductImage` acima.

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "products");
const PUBLIC_PREFIX = "/api/uploads/products";

// Lê um arquivo de imagem já salvo, para a rota que os serve. Valida os
// parâmetros contra path traversal (não confia no que vem da URL).
export async function readProductImage(
  restaurantId: string,
  filename: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!/^[a-z0-9]+$/i.test(restaurantId)) return null;

  const match = filename.match(/^[0-9a-f-]+\.(jpg|png|webp)$/i);
  if (!match) return null;

  const contentTypeByExt: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  const filePath = path.join(UPLOAD_ROOT, restaurantId, filename);

  try {
    const { readFile } = await import("node:fs/promises");
    const buffer = await readFile(filePath);
    return { buffer, contentType: contentTypeByExt[match[1].toLowerCase()] };
  } catch {
    return null;
  }
}

// Best-effort: usado ao trocar/remover a imagem de um produto. Só faz
// alguma coisa para imagens antigas salvas em disco (prefixo
// `/api/uploads/products/...`) — data URLs (novo formato) não têm arquivo
// nenhum para apagar, então essa função é um no-op para elas. Falhas são
// ignoradas (ex.: arquivo já não existe) — nunca deve quebrar a operação
// principal (salvar/excluir o produto).
export async function deleteProductImage(url: string | null | undefined) {
  if (!url || !url.startsWith(`${PUBLIC_PREFIX}/`)) return;

  const relative = url.slice(PUBLIC_PREFIX.length);
  const filePath = path.join(UPLOAD_ROOT, relative);

  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(filePath);
  } catch {
    // arquivo não existe ou já foi removido — ok ignorar
  }
}
