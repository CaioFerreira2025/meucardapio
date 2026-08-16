"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { restaurantSettingsSchema } from "@/lib/validations/restaurant";

export type SettingsFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

// Edita os dados do restaurante já criado (nome, contato, descrição e
// logo). Sem o `slug` — diferente do onboarding (src/app/onboarding/actions.ts),
// que cria o restaurante — porque a URL pública já pode estar impressa em
// QR Codes/cartões de mesa; trocá-la aqui quebraria tudo que já foi
// distribuído.
export async function updateRestaurantSettings(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado" };
  }

  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) {
    return { error: "Restaurante não encontrado" };
  }

  const parsed = restaurantSettingsSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    description: formData.get("description") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      description: parsed.data.description || null,
      logoUrl: parsed.data.logoUrl || null,
    },
  });

  // A logo/nome aparecem em vários lugares fora de /dashboard/settings —
  // painel (QR Code) e cardápio público — então revalida os dois em vez de
  // só a rota atual.
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/r/${restaurant.slug}`);

  return { success: true };
}
