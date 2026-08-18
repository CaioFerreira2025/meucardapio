// Regras dos módulos que o PAINEL e o CARDÁPIO PÚBLICO precisam aplicar do
// mesmo jeito. Ficam aqui, e não dentro da tela de cada módulo, porque uma
// divergência entre os dois lados sairia cara: o lojista veria a loja aberta
// enquanto o cliente vê fechada, ou um cupom aceito na tela e recusado no
// envio.

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export type BusinessHourRow = {
  weekday: number;
  opensAt: number;
  closesAt: number;
  isClosed: boolean;
};

export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * A loja está dentro do horário de funcionamento agora?
 *
 * `now` é sempre calculado no fuso do restaurante (Brasil) por quem chama —
 * o servidor roda em UTC, e usar a hora dele fecharia a loja três horas mais
 * cedo. Ver src/lib/timezone.ts, mesmo cuidado do faturamento do dia.
 *
 * Agenda vazia devolve `true`: um restaurante que ligou o módulo mas ainda
 * não preencheu nada não pode ficar com a loja fechada sem entender por quê.
 */
export function isWithinBusinessHours(
  hours: BusinessHourRow[],
  now: { weekday: number; minutes: number }
): boolean {
  if (hours.length === 0) return true;

  const today = hours.find((h) => h.weekday === now.weekday);
  if (!today || today.isClosed) return false;

  // Expediente que vira a noite (ex.: 18:00 às 02:00): o horário de
  // fechamento é MENOR que o de abertura, então a janela vale das 18h à
  // meia-noite e da meia-noite às 2h. Sem este caso, toda hamburgueria e
  // bar noturno apareceria como fechado justamente no seu horário de pico.
  if (today.closesAt <= today.opensAt) {
    return now.minutes >= today.opensAt || now.minutes < today.closesAt;
  }

  return now.minutes >= today.opensAt && now.minutes < today.closesAt;
}

/** Hora atual no fuso do restaurante (Brasil, UTC-3), pronta para a função acima. */
export function nowInRestaurantTimezone(date: Date = new Date()): {
  weekday: number;
  minutes: number;
} {
  const brasilia = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return {
    weekday: brasilia.getUTCDay(),
    minutes: brasilia.getUTCHours() * 60 + brasilia.getUTCMinutes(),
  };
}

// ===========================================================================
// Cupons
// ===========================================================================

export type CouponRow = {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderCents: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | string | null;
  isActive: boolean;
};

export type CouponResult =
  | { ok: true; code: string; discountCents: number }
  | { ok: false; error: string };

/**
 * Valida um cupom contra o subtotal do carrinho e devolve o desconto em
 * centavos.
 *
 * Usada nos DOIS lados: no cardápio, para mostrar o desconto antes de
 * enviar; e na Server Action que cria o pedido, para recalcular do zero.
 * Confiar no valor que veio da tela deixaria qualquer pessoa forjar um
 * desconto adulterando a requisição.
 */
export function applyCoupon(
  coupon: CouponRow | null | undefined,
  subtotalCents: number,
  now: Date = new Date()
): CouponResult {
  if (!coupon) return { ok: false, error: "Cupom não encontrado." };
  if (!coupon.isActive) return { ok: false, error: "Este cupom não está mais ativo." };

  if (coupon.expiresAt) {
    const expires = coupon.expiresAt instanceof Date ? coupon.expiresAt : new Date(coupon.expiresAt);
    if (!Number.isNaN(expires.getTime()) && now > expires) {
      return { ok: false, error: "Este cupom expirou." };
    }
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "Este cupom atingiu o limite de usos." };
  }

  if (subtotalCents < coupon.minOrderCents) {
    return {
      ok: false,
      error: `Pedido mínimo de ${(coupon.minOrderCents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })} para usar este cupom.`,
    };
  }

  const raw =
    coupon.discountType === "percent"
      ? Math.round((subtotalCents * coupon.discountValue) / 100)
      : coupon.discountValue;

  // O desconto nunca pode passar do subtotal: um cupom de R$ 50 num pedido
  // de R$ 30 daria total negativo.
  const discountCents = Math.max(0, Math.min(raw, subtotalCents));

  return { ok: true, code: coupon.code, discountCents };
}

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
