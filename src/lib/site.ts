// URL base do app, usada para montar redirects (Stripe Checkout, Customer
// Portal, etc). Prefira configurar NEXT_PUBLIC_APP_URL; em dev cai para
// NEXTAUTH_URL ou localhost.
export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  );
}
