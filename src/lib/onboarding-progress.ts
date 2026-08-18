import { prisma } from "@/lib/prisma";
import type { OnboardingProgress } from "@/components/dashboard/onboarding-checklist";

/**
 * Verifica no banco quais dos primeiros passos o lojista já cumpriu.
 *
 * De propósito NÃO existe um campo "onboardingStep" que a gente incrementa:
 * um contador desses desencontra da realidade na primeira vez que alguém
 * apaga a última categoria, restaura um backup ou usa o modo suporte. Aqui
 * cada passo é uma pergunta objetiva feita aos dados de verdade — o
 * checklist não tem como mentir.
 */
export async function getOnboardingProgress(
  restaurantId: string
): Promise<OnboardingProgress> {
  const [restaurant, productCount, orderCount] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { logoUrl: true, phone: true, description: true },
    }),
    // Produto que pertence a alguma categoria DESTE restaurante: cobre os
    // dois passos de uma vez (existe categoria E existe produto nela), que é
    // o que "montar o cardápio" significa na prática. Categoria vazia não
    // conta — o cliente não veria nada.
    prisma.product.count({ where: { category: { restaurantId } } }),
    prisma.order.count({ where: { restaurantId } }),
  ]);

  return {
    // Os três campos que aparecem no topo do cardápio público. Exigir os
    // três junto evita o meio-termo de uma loja com logo mas sem WhatsApp.
    identityDone: Boolean(
      restaurant?.logoUrl && restaurant?.phone && restaurant?.description
    ),
    menuDone: productCount > 0,
    // "Divulgou" é medido pelo resultado (chegou pedido), não pela ação
    // (clicou em copiar link) — clicar em copiar não prova que o QR Code
    // chegou à mesa de alguém.
    sharedDone: orderCount > 0,
  };
}
