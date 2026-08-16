import { cache } from "react";

import { prisma } from "@/lib/prisma";

// `cache()` dedupe a consulta dentro do mesmo request-render (o layout do
// dashboard e a página atual acabam chamando isso para o mesmo usuário).
export const getRestaurantByOwnerId = cache((ownerId: string) => {
  return prisma.restaurant.findUnique({ where: { ownerId } });
});

export function getRestaurantBySlug(slug: string) {
  return prisma.restaurant.findUnique({ where: { slug } });
}
