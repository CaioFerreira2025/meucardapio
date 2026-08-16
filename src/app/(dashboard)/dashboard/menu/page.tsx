import type { Metadata } from "next";
import { UtensilsCrossed } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { pageTitle } from "@/config/brand";
import { CategoryFormDialog } from "@/components/menu/category-form-dialog";
import { CategoryCard } from "@/components/menu/category-card";

export const metadata: Metadata = {
  title: pageTitle("Cardápio"),
};

export default async function MenuPage() {
  const restaurant = await getEffectiveRestaurant();

  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant!.id },
    orderBy: { position: "asc" },
    include: {
      products: {
        orderBy: { position: "asc" },
        include: { complements: { select: { id: true } } },
      },
    },
  });

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  // Lista achatada de todos os produtos do restaurante — usada no seletor
  // "Venda Mais" de cada produto (não pode sugerir a si mesmo).
  const allProducts = categories.flatMap((c) =>
    c.products.map((p) => ({ id: p.id, name: p.name, categoryName: c.name }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Cardápio</h1>
          <p className="text-muted-foreground">
            Organize categorias e produtos do seu cardápio digital.
          </p>
        </div>
        <CategoryFormDialog />
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400/20 to-rose-500/20 ring-1 ring-orange-500/20">
            <UtensilsCrossed className="size-5 text-orange-300" />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria ainda. Crie a primeira (ex.: &quot;Lanches&quot;) para
            começar a cadastrar produtos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              products={category.products}
              allCategories={categoryOptions}
              allProducts={allProducts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
