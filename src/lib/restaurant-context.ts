import { cache } from "react";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { getRestaurantByOwnerId } from "@/lib/restaurant";
import { prisma } from "@/lib/prisma";

// Cookie de "modo suporte": só é escrito pela Server Action
// `startImpersonation` (src/app/admin/actions.ts), que já valida que quem
// está chamando é admin. Mesmo assim, toda leitura abaixo reverifica
// `isAdminEmail` antes de honrar o valor — o cookie sozinho nunca é
// suficiente pra trocar de restaurante.
export const IMPERSONATION_COOKIE = "impersonate_restaurant_id";

export type RestaurantContext = {
  restaurant: NonNullable<Awaited<ReturnType<typeof getRestaurantByOwnerId>>>;
  isImpersonating: boolean;
};

// Resolve qual restaurante a requisição atual deve enxergar/operar: o do
// próprio usuário logado ou, só quando a sessão é de um administrador da
// plataforma em "modo suporte" (cookie de impersonação válido), o
// restaurante de um cliente. Usado tanto nas páginas do painel quanto nas
// Server Actions — assim uma ação disparada em modo suporte (marcar
// pedido, fechar caixa, etc.) afeta o restaurante do cliente, não um
// restaurante "do admin" (que normalmente nem existe).
export const getEffectiveRestaurantContext = cache(
  async (): Promise<RestaurantContext | null> => {
    const session = await auth();
    if (!session?.user?.id) return null;

    if (isAdminEmail(session.user.email)) {
      const cookieStore = await cookies();
      const impersonatedId = cookieStore.get(IMPERSONATION_COOKIE)?.value;
      if (impersonatedId) {
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: impersonatedId },
        });
        if (restaurant) {
          return { restaurant, isImpersonating: true };
        }
        // Cookie aponta pra um restaurante que não existe mais (ex.:
        // excluído) — ignora e cai no comportamento normal abaixo em vez
        // de quebrar a página.
      }
    }

    const restaurant = await getRestaurantByOwnerId(session.user.id);
    if (!restaurant) return null;
    return { restaurant, isImpersonating: false };
  }
);

export async function getEffectiveRestaurant() {
  const ctx = await getEffectiveRestaurantContext();
  return ctx?.restaurant ?? null;
}
