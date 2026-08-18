"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { isModuleEnabled } from "@/lib/modules";
import { parseCentsFromInput } from "@/lib/currency";

// Server Actions dos módulos sob demanda.
//
// TODA ação aqui passa por `requireModule`, que confere no servidor se o
// módulo está ligado PARA ESTE restaurante. Sem isso, o controle de acesso
// seria só a rota — e uma Server Action é um endpoint HTTP como outro
// qualquer: quem descobrisse o identificador dela poderia chamá-la
// diretamente, sem nunca abrir a tela do módulo.
async function requireModule(moduleKey: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");

  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) throw new Error("Restaurante não encontrado");

  if (!(await isModuleEnabled(restaurant.id, moduleKey))) {
    throw new Error("Módulo não disponível para esta conta.");
  }
  return restaurant;
}

function revalidateModule(moduleKey: string, slug: string) {
  revalidatePath(`/dashboard/m/${moduleKey}`);
  // O cardápio público consome bairros, horários e cupons — precisa
  // revalidar junto, senão o lojista salva e o cliente continua vendo o
  // estado antigo.
  revalidatePath(`/r/${slug}`);
}

// ===========================================================================
// Módulo "entregas" — taxa por bairro
// ===========================================================================

export async function saveDeliveryZone(formData: FormData) {
  const restaurant = await requireModule("entregas");

  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  if (!neighborhood) throw new Error("Informe o nome do bairro.");

  const feeCents = parseCentsFromInput(String(formData.get("fee") ?? "0")) ?? 0;
  if (feeCents < 0) throw new Error("Taxa inválida.");

  const count = await prisma.deliveryZone.count({ where: { restaurantId: restaurant.id } });

  await prisma.deliveryZone.upsert({
    where: {
      restaurantId_neighborhood: { restaurantId: restaurant.id, neighborhood },
    },
    // Bairro repetido vira atualização de taxa em vez de erro: é o que o
    // lojista espera ao digitar o mesmo bairro com um valor novo.
    create: { restaurantId: restaurant.id, neighborhood, feeCents, position: count },
    update: { feeCents },
  });

  revalidateModule("entregas", restaurant.slug);
}

export async function deleteDeliveryZone(zoneId: string) {
  const restaurant = await requireModule("entregas");
  // `deleteMany` com o restaurantId no filtro (em vez de `delete` pelo id):
  // garante que ninguém apague a zona de outro restaurante passando um id
  // qualquer.
  await prisma.deliveryZone.deleteMany({ where: { id: zoneId, restaurantId: restaurant.id } });
  revalidateModule("entregas", restaurant.slug);
}

// ===========================================================================
// Módulo "horarios" — agenda de funcionamento
// ===========================================================================

export async function saveBusinessHours(formData: FormData) {
  const restaurant = await requireModule("horarios");

  const updates = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    // O interruptor da tela pergunta "ABRE neste dia" (ver form.tsx), então
    // a ausência do campo é que significa fechado — um interruptor
    // desligado simplesmente não é enviado pelo formulário. Ler isso ao
    // contrário fecharia justamente os dias marcados como abertos.
    const isClosed = formData.get(`open-${weekday}`) !== "on";
    const opensAt = toMinutes(String(formData.get(`opens-${weekday}`) ?? "08:00"));
    const closesAt = toMinutes(String(formData.get(`closes-${weekday}`) ?? "22:00"));

    updates.push(
      prisma.businessHour.upsert({
        where: { restaurantId_weekday: { restaurantId: restaurant.id, weekday } },
        create: { restaurantId: restaurant.id, weekday, opensAt, closesAt, isClosed },
        update: { opensAt, closesAt, isClosed },
      })
    );
  }

  // Transação: a agenda é lida como um conjunto. Salvar dia a dia deixaria
  // uma janela em que metade da semana é nova e metade é velha.
  await prisma.$transaction(updates);
  revalidateModule("horarios", restaurant.slug);
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return Math.min(24 * 60, Math.max(0, h * 60 + m));
}

// ===========================================================================
// Módulo "cupons"
// ===========================================================================

export async function saveCoupon(formData: FormData) {
  const restaurant = await requireModule("cupons");

  // Normalizado em MAIÚSCULAS e sem espaços: o cliente digita "primeira10"
  // ou "Primeira 10" e o cupom continua sendo encontrado.
  const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) throw new Error("Informe o código do cupom.");
  if (code.length > 24) throw new Error("Código muito longo (máximo 24 caracteres).");

  const discountType = String(formData.get("discountType") ?? "percent");
  if (discountType !== "percent" && discountType !== "fixed") {
    throw new Error("Tipo de desconto inválido.");
  }

  const rawValue = String(formData.get("discountValue") ?? "0");
  const discountValue =
    discountType === "percent"
      ? Number(rawValue.replace(/\D/g, ""))
      : (parseCentsFromInput(rawValue) ?? 0);

  if (!discountValue || discountValue <= 0) throw new Error("Informe um desconto válido.");
  if (discountType === "percent" && discountValue > 100) {
    throw new Error("O desconto percentual não pode passar de 100%.");
  }

  const minOrderCents = parseCentsFromInput(String(formData.get("minOrder") ?? "0")) ?? 0;
  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();
  const maxUses = maxUsesRaw ? Number(maxUsesRaw.replace(/\D/g, "")) : null;

  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(`${expiresRaw}T23:59:59`) : null;

  await prisma.coupon.upsert({
    where: { restaurantId_code: { restaurantId: restaurant.id, code } },
    create: {
      restaurantId: restaurant.id,
      code,
      discountType,
      discountValue,
      minOrderCents,
      maxUses,
      expiresAt,
    },
    // Editar um cupom NÃO zera `usedCount` — o histórico de uso é o que
    // sustenta o limite de usos.
    update: { discountType, discountValue, minOrderCents, maxUses, expiresAt },
  });

  revalidateModule("cupons", restaurant.slug);
}

export async function setCouponActive(couponId: string, isActive: boolean) {
  const restaurant = await requireModule("cupons");
  await prisma.coupon.updateMany({
    where: { id: couponId, restaurantId: restaurant.id },
    data: { isActive },
  });
  revalidateModule("cupons", restaurant.slug);
}

export async function deleteCoupon(couponId: string) {
  const restaurant = await requireModule("cupons");
  await prisma.coupon.deleteMany({ where: { id: couponId, restaurantId: restaurant.id } });
  revalidateModule("cupons", restaurant.slug);
}
