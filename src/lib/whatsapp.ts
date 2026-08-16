// Monta um link wa.me a partir de um telefone em formato livre (ex.:
// "(11) 99999-9999") — mantém só os dígitos e garante o DDI 55 (Brasil) na
// frente, que é o que o wa.me espera. `message`, quando informado, vira o
// parâmetro `text` (a mensagem já entra pré-escrita na conversa, o
// destinatário só confirma o envio).
//
// Sem dependências de browser (não usa `window`/`document`) — por isso dá
// pra importar tanto de componentes client (ver src/app/r/[slug]/menu-client.tsx)
// quanto de Server Components (ver src/app/(dashboard)/dashboard/reviews/page.tsx).
export function buildWhatsAppLink(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  const base = `https://wa.me/${withCountryCode}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
