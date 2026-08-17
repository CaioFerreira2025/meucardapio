"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { parseCentsFromInput } from "@/lib/currency";
import { deleteProductImage } from "@/lib/uploads";
import { categorySchema, productSchema } from "@/lib/validations/restaurant";

async function requireRestaurant() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }
  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) {
    throw new Error("Restaurante não encontrado");
  }
  return restaurant;
}

// Filtra os IDs de complementares enviados pelo form, mantendo só produtos
// que realmente pertencem ao restaurante do usuário logado.
async function scopedComplementIds(restaurantId: string, ids: string[] | undefined) {
  if (!ids || ids.length === 0) return [];
  const owned = await prisma.product.findMany({
    where: { id: { in: ids }, category: { restaurantId } },
    select: { id: true },
  });
  return owned.map((p) => p.id);
}

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createCategory(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const restaurant = await requireRestaurant();

  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { fieldErrors: { name: parsed.error.issues[0]?.message ?? "Inválido" } };
  }

  const count = await prisma.category.count({
    where: { restaurantId: restaurant.id },
  });

  await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: parsed.data.name,
      position: count,
    },
  });

  revalidatePath("/dashboard/menu");
  return {};
}

// Move uma categoria uma posição pra cima ou pra baixo na ordem de
// exibição (dashboard e cardápio público usam a mesma `position` — ver
// orderBy em page.tsx aqui e em src/lib/restaurant.ts). Em vez de
// depender de `position` ser sempre contíguo (0,1,2,...) — pode ter
// buracos depois de excluir uma categoria no meio —, buscamos a ordem
// atual já ordenada e trocamos os valores de `position` com o vizinho
// imediato nessa lista, não com "position ± 1" na conta.
export async function moveCategory(categoryId: string, direction: "up" | "down") {
  const restaurant = await requireRestaurant();

  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { position: "asc" },
    select: { id: true, position: true },
  });

  const index = categories.findIndex((c) => c.id === categoryId);
  if (index === -1) return;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= categories.length) {
    // Já está na primeira/última posição — nada a fazer (os botões no
    // painel já ficam desabilitados nesse caso, isso é só a garantia do
    // lado do servidor).
    return;
  }

  const current = categories[index];
  const target = categories[targetIndex];

  // Transação: troca os dois valores de `position` numa única operação
  // atômica, pra nunca ficar um estado intermediário com duas categorias
  // na mesma posição (ex.: se a segunda escrita falhasse sozinha).
  await prisma.$transaction([
    prisma.category.update({
      where: { id: current.id },
      data: { position: target.position },
    }),
    prisma.category.update({
      where: { id: target.id },
      data: { position: current.position },
    }),
  ]);

  revalidatePath("/dashboard/menu");
}

export async function deleteCategory(categoryId: string) {
  const restaurant = await requireRestaurant();

  const category = await prisma.category.findFirst({
    where: { id: categoryId, restaurantId: restaurant.id },
    include: { products: { select: { imageUrl: true } } },
  });
  if (!category) return;

  await prisma.category.delete({ where: { id: category.id } });

  await Promise.all(category.products.map((p) => deleteProductImage(p.imageUrl)));

  revalidatePath("/dashboard/menu");
}

export async function createProduct(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const restaurant = await requireRestaurant();

  const parsed = productSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    cost: formData.get("cost") ?? "",
    isAvailable: formData.get("isAvailable") === "on",
    imageUrl: formData.get("imageUrl") ?? "",
    complementIds: formData.getAll("complementIds").map(String),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, restaurantId: restaurant.id },
  });
  if (!category) {
    return { error: "Categoria inválida" };
  }

  const priceCents = parseCentsFromInput(parsed.data.price);
  if (priceCents === null) {
    return { fieldErrors: { price: "Preço inválido" } };
  }

  const costCents = parsed.data.cost ? parseCentsFromInput(parsed.data.cost) : null;
  if (parsed.data.cost && costCents === null) {
    return { fieldErrors: { cost: "Custo inválido" } };
  }

  // Só permite ligar produtos complementares do mesmo restaurante (evita
  // que alguém injete IDs de outro dono via formulário adulterado).
  const complementIds = await scopedComplementIds(restaurant.id, parsed.data.complementIds);

  const count = await prisma.product.count({
    where: { categoryId: category.id },
  });

  await prisma.product.create({
    data: {
      categoryId: category.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      priceCents,
      costCents,
      isAvailable: parsed.data.isAvailable,
      imageUrl: parsed.data.imageUrl || null,
      position: count,
      complements: { connect: complementIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/dashboard/menu");
  return {};
}

export async function updateProduct(
  productId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const restaurant = await requireRestaurant();

  const parsed = productSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    cost: formData.get("cost") ?? "",
    isAvailable: formData.get("isAvailable") === "on",
    imageUrl: formData.get("imageUrl") ?? "",
    complementIds: formData.getAll("complementIds").map(String),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, category: { restaurantId: restaurant.id } },
  });
  if (!product) {
    return { error: "Produto não encontrado" };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, restaurantId: restaurant.id },
  });
  if (!category) {
    return { error: "Categoria inválida" };
  }

  const priceCents = parseCentsFromInput(parsed.data.price);
  if (priceCents === null) {
    return { fieldErrors: { price: "Preço inválido" } };
  }

  const costCents = parsed.data.cost ? parseCentsFromInput(parsed.data.cost) : null;
  if (parsed.data.cost && costCents === null) {
    return { fieldErrors: { cost: "Custo inválido" } };
  }

  const complementIds = await scopedComplementIds(restaurant.id, parsed.data.complementIds);

  const newImageUrl = parsed.data.imageUrl || null;

  await prisma.product.update({
    where: { id: productId },
    data: {
      categoryId: category.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      priceCents,
      costCents,
      isAvailable: parsed.data.isAvailable,
      imageUrl: newImageUrl,
      // `set` substitui a lista inteira de complementares por essa —
      // reflete exatamente o que veio marcado no formulário.
      complements: { set: complementIds.map((id) => ({ id })) },
    },
  });

  if (product.imageUrl && product.imageUrl !== newImageUrl) {
    await deleteProductImage(product.imageUrl);
  }

  revalidatePath("/dashboard/menu");
  return {};
}

export async function deleteProduct(productId: string) {
  const restaurant = await requireRestaurant();

  const product = await prisma.product.findFirst({
    where: { id: productId, category: { restaurantId: restaurant.id } },
  });
  if (!product) return;

  await prisma.product.delete({ where: { id: product.id } });
  await deleteProductImage(product.imageUrl);

  revalidatePath("/dashboard/menu");
}

export async function toggleProductAvailability(
  productId: string,
  isAvailable: boolean
) {
  const restaurant = await requireRestaurant();

  await prisma.product.updateMany({
    where: { id: productId, category: { restaurantId: restaurant.id } },
    data: { isAvailable },
  });

  revalidatePath("/dashboard/menu");
}
