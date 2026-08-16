// Constantes compartilhadas entre client e server. Ficam separadas de
// src/lib/uploads.ts porque aquele arquivo importa módulos do Node
// (node:fs, node:path) que não podem ser incluídos em bundles de client
// component.
// A imagem é guardada como data URL (base64) direto no banco — ver o
// comentário em src/lib/uploads.ts. Por isso o limite é bem mais baixo que
// um upload "de arquivo" normal: cada imagem vira ~33% maior em base64 e
// fica embutida no HTML da página pública do cardápio (todo produto com
// foto soma nesse peso). 1.5MB de arquivo original é de sobra para uma
// foto de produto num cardápio.
export const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024; // 1.5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
