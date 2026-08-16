// URL base do app — usada para montar redirects (Stripe Checkout, Customer
// Portal, etc.) e o link/QR Code do cardápio público no painel. Sempre
// vem de NEXT_PUBLIC_APP_URL (a mesma variável configurada no `.env`);
// só cai para NEXTAUTH_URL ou localhost se ela não estiver definida (ou
// estiver em branco). `.trim()` evita usar uma string vazia por engano, e
// a barra final é removida pra nunca virar "//r/slug" ao concatenar.
export function getAppUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";

  return configured.replace(/\/+$/, "");
}
