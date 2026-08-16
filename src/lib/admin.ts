// Identificação do administrador da plataforma (dono do SaaS "Meu
// Restaurante"), não confundir com o "dono do restaurante" (cliente
// assinante). Não existe campo no banco pra isso de propósito — é só uma
// lista de emails autorizados, então nenhuma migração é necessária e dá
// pra adicionar mais administradores depois via variável de ambiente sem
// mexer em código.
const DEFAULT_ADMIN_EMAILS = ["oasiscarestetica@gmail.com"];

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS?.trim()
  ? process.env.ADMIN_EMAILS.split(",")
  : DEFAULT_ADMIN_EMAILS
)
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
