// Formas de pagamento usadas no fechamento de mesa e no Caixa. Guardado
// como String simples em Order.paymentMethod (mesmo padrão de Order.status
// — ver src/lib/order-status.ts), `null` = ainda não informado.
export const PAYMENT_METHODS = ["cash", "pix", "card"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  card: "Cartão",
};

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}
