"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations/restaurant";
import { getEnabledModuleKeys } from "@/lib/modules";
import {
  applyCoupon,
  isWithinBusinessHours,
  normalizeCouponCode,
  nowInRestaurantTimezone,
} from "@/modules/shared";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(200).optional(),
});

const checkoutSchema = z.object({
  slug: z.string().min(1),
  customerName: z.string().min(2, "Informe seu nome").max(80),
  customerPhone: z.string().min(8, "Informe um telefone válido").max(20),
  // Obrigatório — sem mesa/comanda a equipe não sabe pra onde levar o
  // pedido nem consegue vincular o "Pedir a conta"/histórico de sessão
  // (ver ActiveOrderPanel) à mesa certa.
  tableNumber: z
    .string()
    .trim()
    .min(1, "Informe o número da mesa ou comanda")
    .max(20),
  notes: z.string().max(300).optional(),
  items: z.array(cartItemSchema).min(1, "Seu carrinho está vazio"),
  // Campos dos módulos sob demanda. Opcionais: um restaurante sem os
  // módulos nunca os envia, e um cliente que os enviasse à força seria
  // ignorado — a checagem de módulo ligado acontece no servidor, abaixo.
  neighborhood: z.string().trim().max(80).optional(),
  couponCode: z.string().trim().max(24).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CheckoutResult =
  | { success: true; orderId: string }
  | { success: false; error: string };

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (!restaurant) {
    return { success: false, error: "Restaurante não encontrado" };
  }
  if (!restaurant.isOpen) {
    return { success: false, error: "Este restaurante não está aceitando pedidos no momento." };
  }

  // ===== Módulos sob demanda =====
  // Reconferidos AQUI, e não só na tela: a tela some para quem não tem o
  // módulo, mas uma Server Action é um endpoint como outro qualquer. Sem
  // esta checagem, dava para forjar um cupom ou pular o horário chamando a
  // ação direto.
  const moduleKeys = await getEnabledModuleKeys(restaurant.id);

  if (moduleKeys.includes("horarios")) {
    const hours = await prisma.businessHour.findMany({
      where: { restaurantId: restaurant.id },
      select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
    });
    if (!isWithinBusinessHours(hours, nowInRestaurantTimezone())) {
      return {
        success: false,
        error: "Estamos fechados neste horário. Confira os horários de funcionamento.",
      };
    }
  }

  const productIds = parsed.data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isAvailable: true,
      category: { restaurantId: restaurant.id },
    },
  });

  if (products.length !== new Set(productIds).size) {
    return {
      success: false,
      error: "Um ou mais itens do carrinho não estão mais disponíveis.",
    };
  }

  const productById = new Map(products.map((p) => [p.id, p]));

  let subtotalCents = 0;
  const orderItemsData = parsed.data.items.map((item) => {
    const product = productById.get(item.productId)!;
    subtotalCents += product.priceCents * item.quantity;
    return {
      productId: product.id,
      productName: product.name,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      notes: item.notes || null,
    };
  });

  // ----- Taxa de entrega (módulo "entregas") -----
  // O valor vem do BANCO a partir do bairro escolhido, nunca do que a tela
  // mandou: aceitar a taxa enviada pelo cliente deixaria qualquer um zerar
  // o próprio frete.
  let deliveryFeeCents = 0;
  let neighborhood: string | null = null;

  if (moduleKeys.includes("entregas") && parsed.data.neighborhood) {
    const zone = await prisma.deliveryZone.findFirst({
      where: { restaurantId: restaurant.id, neighborhood: parsed.data.neighborhood },
      select: { neighborhood: true, feeCents: true },
    });
    if (!zone) {
      return { success: false, error: "Ainda não entregamos nesse bairro." };
    }
    neighborhood = zone.neighborhood;
    deliveryFeeCents = zone.feeCents;
  }

  // ----- Cupom (módulo "cupons") -----
  // Mesmo princípio: o desconto é recalculado do zero pela mesma função que
  // a tela usou (applyCoupon, em src/modules/shared.ts).
  let discountCents = 0;
  let couponCode: string | null = null;

  if (moduleKeys.includes("cupons") && parsed.data.couponCode) {
    const code = normalizeCouponCode(parsed.data.couponCode);
    const coupon = await prisma.coupon.findFirst({
      where: { restaurantId: restaurant.id, code },
    });
    const result = applyCoupon(coupon, subtotalCents);
    if (!result.ok) {
      return { success: false, error: result.error };
    }
    discountCents = result.discountCents;
    couponCode = result.code;
  }

  const totalCents = Math.max(0, subtotalCents - discountCents) + deliveryFeeCents;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        restaurantId: restaurant.id,
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        tableNumber: parsed.data.tableNumber,
        notes: parsed.data.notes || null,
        totalCents,
        deliveryFeeCents,
        discountCents,
        couponCode,
        neighborhood,
        items: { create: orderItemsData },
      },
    });

    // Incremento do uso do cupom dentro da MESMA transação do pedido: se a
    // criação falhar, o contador não sobe; e `increment` (em vez de ler,
    // somar e gravar) evita que dois pedidos simultâneos com o mesmo cupom
    // contem como um só e furem o limite de usos.
    if (couponCode) {
      await tx.coupon.updateMany({
        where: { restaurantId: restaurant.id, code: couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return created;
  });

  return { success: true, orderId: order.id };
}

// ---------------------------------------------------------------------------
// Conferência de cupom no carrinho (módulo "cupons")
// ---------------------------------------------------------------------------
// Existe para o cliente ver o desconto ANTES de enviar o pedido. Precisa ser
// uma Server Action, e não uma lista de cupons entregue à tela: mandar os
// cupons pro navegador exporia todos os códigos promocionais do restaurante
// para qualquer um que abrisse o cardápio.
//
// O resultado daqui é só informativo — `createOrder` recalcula tudo do zero
// (mesma função `applyCoupon`) antes de gravar o pedido.
export type ValidateCouponResult =
  | { ok: true; code: string; discountCents: number }
  | { ok: false; error: string };

export async function validateCoupon(input: {
  slug: string;
  code: string;
  subtotalCents: number;
}): Promise<ValidateCouponResult> {
  const parsed = z
    .object({
      slug: z.string().min(1),
      code: z.string().trim().min(1).max(24),
      subtotalCents: z.number().int().min(0),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cupom inválido." };

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (!restaurant) return { ok: false, error: "Restaurante não encontrado." };

  // Módulo desligado = o cupom simplesmente não existe para este
  // restaurante, mesmo que a linha ainda esteja no banco de um período em
  // que o módulo esteve ligado.
  const moduleKeys = await getEnabledModuleKeys(restaurant.id);
  if (!moduleKeys.includes("cupons")) {
    return { ok: false, error: "Cupom não encontrado." };
  }

  const coupon = await prisma.coupon.findFirst({
    where: { restaurantId: restaurant.id, code: normalizeCouponCode(parsed.data.code) },
  });

  return applyCoupon(coupon, parsed.data.subtotalCents);
}

export type SubmitReviewInput = {
  slug: string;
  rating: number;
  comment?: string;
  name: string;
  phone: string;
};

export type SubmitReviewResult =
  | { success: true }
  | { success: false; error: string };

// Avaliação da experiência — cliente sem cadastro/login, acionada pelo menu
// inferior do cardápio público (Mais -> Avaliar experiência). Cada envio
// cria uma linha nova em Review; não há limite de 1 por cliente (não temos
// como identificar o cliente de forma confiável sem login) nem vínculo
// obrigatório com um pedido específico — o cliente pode avaliar mesmo sem
// ter finalizado um pedido ainda. Nome e telefone são obrigatórios (ver
// reviewSchema) pra o lojista sempre conseguir identificar/responder quem
// avaliou.
export async function submitReview(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const parsed = reviewSchema.safeParse({
    rating: input.rating,
    comment: input.comment ?? "",
    name: input.name,
    phone: input.phone,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (!restaurant) {
    return { success: false, error: "Restaurante não encontrado" };
  }

  await prisma.review.create({
    data: {
      restaurantId: restaurant.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
      name: parsed.data.name,
      phone: parsed.data.phone,
    },
  });

  return { success: true };
}
