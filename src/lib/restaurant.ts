import { cache } from "react";

import { prisma } from "@/lib/prisma";

// `cache()` dedupe a consulta dentro do mesmo request-render (o layout do
// dashboard e a página atual acabam chamando isso para o mesmo usuário).
export const getRestaurantByOwnerId = cache((ownerId: string) => {
  return prisma.restaurant.findUnique({ where: { ownerId } });
});

// `cache()` dedupe a consulta dentro do mesmo request-render — a página do
// cardápio público chama isso tanto em `generateMetadata` quanto no
// componente da página, e sem cache isso virava 2 consultas idênticas ao
// banco a cada carregamento (via QR Code, isso soma rápido no salão).
export const getRestaurantBySlug = cache((slug: string) => {
  return prisma.restaurant.findUnique({ where: { slug } });
});
