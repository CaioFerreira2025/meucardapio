// Planos de assinatura. Os `priceId`s vêm do Stripe Dashboard (Products >
// Pricing) e são configurados via variáveis de ambiente — assim é possível
// ter preços diferentes em teste e produção sem tocar no código.
export type Plan = {
  id: "starter" | "pro";
  name: string;
  description: string;
  price: string;
  // Mesmo valor de `price`, mas em centavos — usado para somar receita
  // (ex.: MRR no Painel Administrativo) sem precisar fazer parsing da
  // string de exibição.
  priceCents: number;
  priceId: string | undefined;
  features: string[];
  highlighted?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Para começar e validar seu produto.",
    price: "R$ 29/mês",
    priceCents: 2900,
    priceId: process.env.STRIPE_PRICE_ID_STARTER,
    features: ["1 usuário", "Recursos essenciais", "Suporte por email"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para quem já está crescendo.",
    price: "R$ 99/mês",
    priceCents: 9900,
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    features: [
      "Usuários ilimitados",
      "Todos os recursos",
      "Suporte prioritário",
    ],
    highlighted: true,
  },
];

export function getPlanByPriceId(priceId: string | null | undefined) {
  if (!priceId) return undefined;
  return PLANS.find((plan) => plan.priceId === priceId);
}
