// ============================================================================
// PLANOS E CICLOS DE COBRANÇA
// ============================================================================
//
// Cada plano (Starter/Pro) é vendido em três ciclos: mensal, trimestral e
// anual. Cada COMBINAÇÃO plano+ciclo é uma oferta separada no painel da
// Cakto, com seu próprio link de checkout — são 6 ofertas no total.
//
// Como ligar aos produtos da Cakto: cadastre 6 ofertas lá e coloque o id de
// cada uma na variável de ambiente correspondente (ver .env.example). O id
// aparece na URL do checkout: pay.cakto.com.br/<id>.
//
// Regra de preço: o desconto incide sobre a mensalidade e o cliente paga o
// período inteiro de uma vez. `totalCents` é o que a Cakto cobra; o
// "R$ X/mês" que aparece no card é `monthlyEquivalentCents`, um número de
// VITRINE, nunca o valor cobrado. Manter os dois separados evita o erro
// clássico de somar o preço anual no MRR como se fosse mensalidade — ver
// mrrCents em src/app/admin/page.tsx.

export type BillingCycle = "monthly" | "quarterly" | "annual";

export type PlanPrice = {
  cycle: BillingCycle;
  /** Meses cobertos por uma cobrança. */
  months: number;
  /** Valor efetivamente cobrado de uma vez pela Cakto. */
  totalCents: number;
  /** Vitrine: total dividido pelos meses. Nunca é cobrado isoladamente. */
  monthlyEquivalentCents: number;
  /** 0, 10 ou 30 — usado nas etiquetas de desconto. */
  discountPercent: number;
  caktoOfferId: string | undefined;
  /**
   * Ids de oferta ANTIGOS que continuam sendo reconhecidos para este
   * plano+ciclo. Existe para proteger quem já assinou: a assinatura guarda o
   * id da oferta usada na compra, então se esse id parasse de ser
   * reconhecido, um cliente adimplente veria "Nenhum plano ativo" na tela de
   * Cobrança e sumiria do cálculo de MRR — sem nada de errado com o
   * pagamento dele.
   */
  legacyCaktoOfferIds?: string[];
};

export type Plan = {
  id: "starter" | "pro";
  name: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  prices: Record<BillingCycle, PlanPrice>;
};

export const BILLING_CYCLES: {
  key: BillingCycle;
  label: string;
  shortLabel: string;
  months: number;
  discountPercent: number;
  /** Etiqueta ao lado do seletor de ciclo. */
  badge?: string;
}[] = [
  { key: "monthly", label: "Mensal", shortLabel: "Mensal", months: 1, discountPercent: 0 },
  {
    key: "quarterly",
    label: "Trimestral",
    shortLabel: "Trimestral",
    months: 3,
    discountPercent: 10,
    badge: "-10%",
  },
  {
    key: "annual",
    label: "Anual",
    shortLabel: "Anual",
    months: 12,
    discountPercent: 30,
    badge: "-30%",
  },
];

/** Ciclo aberto por padrão nas telas de plano — o que queremos vender. */
export const DEFAULT_BILLING_CYCLE: BillingCycle = "annual";

export const ANNUAL_DISCOUNT_PERCENT = 30;

export const ANNUAL_PITCH =
  "O melhor investimento para o seu restaurante. Garanta o ano todo com desconto máximo.";

// Os ids de oferta antigos (CAKTO_OFFER_ID_STARTER / _PRO) continuam sendo
// aceitos como o ciclo MENSAL. Isso existe para não quebrar o ambiente que
// já está no ar: quem já tinha essas duas variáveis configuradas segue
// vendendo mensal normalmente enquanto cadastra as ofertas novas.
const offerId = {
  starterMonthly: process.env.CAKTO_OFFER_ID_STARTER_MONTHLY ?? process.env.CAKTO_OFFER_ID_STARTER,
  starterQuarterly: process.env.CAKTO_OFFER_ID_STARTER_QUARTERLY,
  starterAnnual: process.env.CAKTO_OFFER_ID_STARTER_ANNUAL,
  proMonthly: process.env.CAKTO_OFFER_ID_PRO_MONTHLY ?? process.env.CAKTO_OFFER_ID_PRO,
  proQuarterly: process.env.CAKTO_OFFER_ID_PRO_QUARTERLY,
  proAnnual: process.env.CAKTO_OFFER_ID_PRO_ANNUAL,
};

// Monta os três ciclos a partir da mensalidade cheia. Os valores derivam do
// preço-base em vez de serem digitados um a um de propósito: mudar o preço
// do plano passa a ser mexer num número só, sem risco de trimestral e anual
// ficarem desencontrados do mensal.
function buildPrices(
  baseMonthlyCents: number,
  ids: { monthly?: string; quarterly?: string; annual?: string; legacyMonthly?: string }
): Record<BillingCycle, PlanPrice> {
  const build = (
    cycle: BillingCycle,
    id: string | undefined,
    legacy?: string
  ): PlanPrice => {
    const spec = BILLING_CYCLES.find((c) => c.key === cycle)!;
    const monthlyEquivalentCents = Math.round(
      baseMonthlyCents * (1 - spec.discountPercent / 100)
    );
    return {
      cycle,
      months: spec.months,
      monthlyEquivalentCents,
      totalCents: monthlyEquivalentCents * spec.months,
      discountPercent: spec.discountPercent,
      caktoOfferId: id,
      legacyCaktoOfferIds: legacy && legacy !== id ? [legacy] : undefined,
    };
  };

  return {
    monthly: build("monthly", ids.monthly, ids.legacyMonthly),
    quarterly: build("quarterly", ids.quarterly),
    annual: build("annual", ids.annual),
  };
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Para começar e validar seu produto.",
    features: ["1 usuário", "Recursos essenciais", "Suporte por email"],
    prices: buildPrices(4900, {
      monthly: offerId.starterMonthly,
      quarterly: offerId.starterQuarterly,
      annual: offerId.starterAnnual,
      legacyMonthly: process.env.CAKTO_OFFER_ID_STARTER,
    }),
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para quem já está crescendo.",
    features: ["Usuários ilimitados", "Todos os recursos", "Suporte prioritário"],
    highlighted: true,
    prices: buildPrices(9900, {
      monthly: offerId.proMonthly,
      quarterly: offerId.proQuarterly,
      annual: offerId.proAnnual,
      legacyMonthly: process.env.CAKTO_OFFER_ID_PRO,
    }),
  },
];

/**
 * Descobre plano e ciclo a partir do id de oferta que veio no webhook da
 * Cakto. Precisa varrer os 6 ids (e não só 2, como antes) porque agora é a
 * oferta que identifica também a periodicidade contratada.
 */
export function getPlanByOfferId(
  offerIdValue: string | null | undefined
): { plan: Plan; price: PlanPrice } | undefined {
  if (!offerIdValue) return undefined;
  for (const plan of PLANS) {
    for (const price of Object.values(plan.prices)) {
      if (price.caktoOfferId === offerIdValue) {
        return { plan, price };
      }
      // Ids antigos também valem — ver legacyCaktoOfferIds acima.
      if (price.legacyCaktoOfferIds?.includes(offerIdValue)) {
        return { plan, price };
      }
    }
  }
  return undefined;
}

/** Mensalidade equivalente mais barata da plataforma — usada em "a partir de". */
export function getCheapestMonthlyEquivalentCents(): number {
  return Math.min(
    ...PLANS.flatMap((plan) =>
      Object.values(plan.prices).map((p) => p.monthlyEquivalentCents)
    )
  );
}

export function formatCycleLabel(cycle: BillingCycle): string {
  return BILLING_CYCLES.find((c) => c.key === cycle)?.label ?? cycle;
}
