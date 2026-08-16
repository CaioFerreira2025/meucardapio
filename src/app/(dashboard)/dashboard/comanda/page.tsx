import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRestaurantByOwnerId } from "@/lib/restaurant";
import { pageTitle } from "@/config/brand";
import { ComandaClient } from "@/components/comanda/comanda-client";

export const metadata: Metadata = {
  title: pageTitle("Comanda"),
};

export default async function ComandaPage() {
  const session = await auth();
  const restaurant = await getRestaurantByOwnerId(session!.user!.id);

  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant!.id },
    orderBy: { position: "asc" },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { position: "asc" },
      },
    },
  });

  // Só categorias com pelo menos um produto disponível fazem sentido na
  // comanda — evita abas vazias enquanto o garçom lança o pedido correndo.
  const categoriesWithProducts = categories.filter((c) => c.products.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Comanda</h1>
        <p className="text-muted-foreground">
          Lance o pedido do cliente direto da mesa — vai para a cozinha na hora.
        </p>
      </div>

      <ComandaClient categories={categoriesWithProducts} />
    </div>
  );
}
