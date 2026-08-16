import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

// STRIPE_SECRET_KEY pode não estar configurada (ex.: build sem as chaves
// reais, ou ambiente de dev sem Stripe). Nesse caso o client é criado com
// um placeholder — ele nunca chega a ser chamado, pois toda rota que usa
// o Stripe verifica `isStripeConfigured` antes e retorna um erro claro.
export const stripe = new Stripe(secretKey || "sk_test_placeholder", {
  typescript: true,
});

export const isStripeConfigured = Boolean(secretKey);
