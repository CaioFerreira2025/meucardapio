import { readProductImage } from "@/lib/uploads";

// Serve os arquivos de upload dinamicamente (fora de `public/`) — ver o
// comentário em src/lib/uploads.ts sobre por que isso é necessário.
// Público de propósito: são fotos de produtos exibidas no cardápio
// público, sem dado sensível; os nomes de arquivo são UUIDs.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ restaurantId: string; filename: string }> }
) {
  const { restaurantId, filename } = await params;

  const file = await readProductImage(restaurantId, filename);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      // Nome de arquivo é um UUID único por upload — pode cachear "para sempre".
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
