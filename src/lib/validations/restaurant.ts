import { z } from "zod";

export const restaurantSchema = z.object({
  name: z.string().min(2, "Informe o nome do restaurante").max(80),
  slug: z
    .string()
    .min(3, "A URL precisa ter pelo menos 3 caracteres")
    .max(60)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens"
    ),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(300).optional().or(z.literal("")),
});
export type RestaurantInput = z.infer<typeof restaurantSchema>;

// Formulário de Configurações (edição, diferente do onboarding acima: sem
// `slug`, que não pode ser trocado depois de criado — o QR Code e os links
// já impressos apontam pra ele). Inclui a logo, que segue o mesmo formato
// de armazenamento das fotos de produto (data URL base64 — ver
// src/lib/uploads.ts), daí o limite de tamanho igual ao de `imageUrl` em
// productSchema.
export const restaurantSettingsSchema = z.object({
  name: z.string().min(2, "Informe o nome do restaurante").max(80),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(300).optional().or(z.literal("")),
  logoUrl: z.string().max(2_200_000).optional().or(z.literal("")),
});
export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;

// Avaliação da experiência (cliente, cardápio público — sem login). Nota
// obrigatória de 1 a 5; comentário opcional e curto (é um comentário
// rápido pós-atendimento, não uma resenha).
export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Escolha de 1 a 5 estrelas")
    .max(5, "Escolha de 1 a 5 estrelas"),
  comment: z.string().max(500).optional().or(z.literal("")),
  // Nome/telefone de quem avaliou — opcionais, mesmos limites de tamanho
  // usados em customerName/customerPhone do checkout (checkoutSchema em
  // src/app/r/[slug]/actions.ts), sem o `.min(...)` de lá porque aqui não
  // são obrigatórios.
  name: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria").max(50),
});
export type CategoryInput = z.infer<typeof categorySchema>;

const moneyInput = z
  .string()
  .refine((value) => value.trim() === "" || value.trim().replace(",", ".").match(/^\d+(\.\d{1,2})?$/), {
    message: "Use um valor como 12,90",
  });

export const productSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria"),
  name: z.string().min(2, "Informe o nome do produto").max(80),
  description: z.string().max(300).optional().or(z.literal("")),
  price: z
    .string()
    .min(1, "Informe o preço")
    .refine((value) => value.trim().replace(",", ".").match(/^\d+(\.\d{1,2})?$/), {
      message: "Use um valor como 12,90",
    }),
  // Custo (opcional) — usado só para calcular a margem no painel; nunca
  // aparece no cardápio público.
  cost: moneyInput.optional().or(z.literal("")),
  isAvailable: z.boolean(),
  // A imagem vira uma data URL (base64) guardada direto no banco — ver
  // src/lib/uploads.ts. 1.5MB de arquivo original vira ~2MB em base64, daí
  // o limite bem mais alto que uma URL comum; o tamanho do arquivo em si já
  // é validado no upload (src/lib/uploads-shared.ts MAX_UPLOAD_BYTES).
  imageUrl: z.string().max(2_200_000).optional().or(z.literal("")),
  // IDs de produtos complementares (Venda Mais), vem do form como uma lista
  // de valores repetidos do mesmo campo (checkboxes com o mesmo `name`).
  complementIds: z.array(z.string()).optional(),
});
export type ProductInput = z.infer<typeof productSchema>;
