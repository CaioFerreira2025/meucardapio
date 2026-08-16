"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { emitOrderEvent } from "@/lib/order-events";

const staffCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(200).optional(),
});

const staffOrderSchema = z.object({
  tableNumber: z.string().min(1, "Informe o número da mesa").max(20),
  notes: z.string().max(300).optional(),
  items: z.array(staffCartItemSchema).min(1, "Adicione pelo menos um item"),
});

export type StaffOrderInput = z.infer<typeof staffOrderSchema>;

export type StaffOrderResult =
  | { success: true; orderId: string }
  | { success: false; error: string };

// Comanda mobile do garçom: cria o pedido no mesmo Order/OrderItem e com o
// mesmo emitOrderEvent do checkout público (src/app/r/[slug]/actions.ts) —
// só que autenticado como dono/operador do restaurante, em vez de vir do
// cardápio público. Por isso o pedido aparece automaticamente na cozinha e
// na Central de Pedidos, sem precisar mudar nada lá.
export async function createStaffOrder(
  input: StaffOrderInput
): Promise<StaffOrderResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const parsed = staffOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) {
    return { success: false, error: "Restaurante não encontrado" };
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
      error: "Um ou mais itens não estão mais disponíveis.",
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
      // Order.customerName/customerPhone são obrigatórios no schema (usados
      // pelo checkout do cliente). Pedido de comanda não tem cliente
      // identificado, então preenchemos algo que deixa claro a origem do
      // pedido em vez de deixar em branco.
      customerName: `Comanda — Mesa ${parsed.data.tableNumber}`,
      customerPhone: "",
      tableNumber: parsed.data.tableNumber,
      notes: parsed.data.notes || null,
      totalCents,
      items: { create: orderItemsData },
    },
  });

  emitOrderEvent(restaurant.id, { type: "new_order", orderId: order.id });

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");

  return { success: true, orderId: order.id };
}
