"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations/restaurant";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(200).optional(),
});

const checkoutSchema = z.object({
  slug: z.string().min(1),
  customerName: z.string().min(2, "Informe seu nome").max(80),
  customerPhone: z.string().min(8, "Informe um telefone válido").max(20),
  tableNumber: z.string().max(20).optional(),
  notes: z.string().max(300).optional(),
  items: z.array(cartItemSchema).min(1, "Seu carrinho está vazio"),
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

  let totalCents = 0;
  const orderItemsData = parsed.data.items.map((item) => {
    const product = productById.get(item.productId)!;
    totalCents += product.priceCents * item.quantity;
    return {
      productId: product.id,
      productName: product.name,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      notes: item.notes || null,
    };
  });

  const order = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      tableNumber: parsed.data.tableNumber || null,
      notes: parsed.data.notes || null,
      totalCents,
      items: { create: orderItemsData },
    },
  });

  return { success: true, orderId: order.id };
}

export type SubmitReviewInput = {
  slug: string;
  rating: number;
  comment?: string;
  name?: string;
  phone?: string;
};

export type SubmitReviewResult =
  | { success: true }
  | { success: false; error: string };

// Avaliação da experiência — cliente sem cadastro/login, acionada pelo menu
// inferior do cardápio público (Mais -> Avaliar experiência). Cada envio
// cria uma linha nova em Review; não há limite de 1 por cliente (não temos
// como identificar o cliente de forma confiável sem login) nem vínculo
// obrigatório com um pedido específico — o cliente pode avaliar mesmo sem
// ter finalizado um pedido ainda.
export async function submitReview(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const parsed = reviewSchema.safeParse({
    rating: input.rating,
    comment: input.comment ?? "",
    name: input.name ?? "",
    phone: input.phone ?? "",
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
      name: parsed.data.name || null,
      phone: parsed.data.phone || null,
    },
  });

  return { success: true };
}
