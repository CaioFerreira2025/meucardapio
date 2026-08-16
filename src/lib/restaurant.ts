import { cache } from "react";

import { prisma } from "@/lib/prisma";

// `cache()` dedupe a consulta dentro do mesmo request-render (o layout do
// dashboard e a página atual acabam chamando isso para o mesmo usuário).
export const getRestaurantByOwnerId = cache((ownerId: string) => {
  return prisma.restaurant.findUnique({ where: { ownerId } });
});

// Cardápio público (/r/[slug]) inteiro numa consulta só — antes eram 2
// idas ao banco (restaurante, depois categorias/produtos/complementos em
// outra query separada). `cache()` dedupe entre `generateMetadata` e o
// componente da página (os dois chamam essa mesma função com o mesmo
// slug), então o resultado é 1 única consulta ao Postgres por carregamento
// da página, não 2 — reduz o tempo até a primeira renderização,
// especialmente sensível pelo QR Code no salão. `select` explícito traz só
// os campos realmente usados na tela (sem custo, disponibilidade já
// filtrada, datas etc.).
export const getPublicMenuBySlug = cache((slug: string) => {
  return prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      address: true,
      isOpen: true,
      categories: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          products: {
            where: { isAvailable: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              priceCents: true,
              imageUrl: true,
              // "Venda mais" — só sugere complementares que também estão
              // disponíveis no momento.
              complements: {
                where: { isAvailable: true },
                select: { id: true, name: true, priceCents: true, imageUrl: true },
              },
            },
          },
        },
      },
    },
  });
});
