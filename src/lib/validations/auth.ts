import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Informe seu nome completo").max(100),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres")
    .max(72, "A senha pode ter no máximo 72 caracteres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;
