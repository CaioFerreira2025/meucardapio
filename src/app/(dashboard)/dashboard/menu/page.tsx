import type { Metadata } from "next";
import { UtensilsCrossed } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { pageTitle } from "@/config/brand";
import { CategoryFormDialog } from "@/components/menu/category-form-dialog";
import { CategoryCard } from "@/components/menu/category-card";
import { PaywallScreen } from "@/components/billing/paywall-screen";
import { getAccessState } from "@/lib/access";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHelp } from "@/components/dashboard/page-help";

export const metadata: Metadata = {
  title: pageTitle("Cardápio"),
};

export default async function MenuPage() {
  // Paywall: com o teste expirado (ou pagamento pendente/assinatura
  // encerrada) esta tela dá lugar à escolha de plano. Só "Cobrança" e
  // "Configurações" seguem liberadas — são justamente as telas que o lojista
  // precisa para voltar a ficar em dia.
  const access = await getAccessState();
  if (!access.hasFullAccess) {
    return <PaywallScreen state={access} />;
  }

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
          <h1 className="flex items-center gap-1 text-2xl font-semibold tracking-tight text-white">
            Cardápio
            <PageHelp page="menu" />
          </h1>
          <p className="text-muted-foreground">
            Organize categorias e produtos do seu cardápio digital.
          </p>
        </div>
        <CategoryFormDialog />
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Seu cardápio começa aqui"
          description="Categorias são os grupos que o cliente vê ao abrir o cardápio — Entradas, Pratos, Bebidas. Crie a primeira e depois cadastre os produtos dentro dela."
        >
          {/* O botão de criar vive num client component (abre modal), então
              entra como filho em vez de virar link no EmptyState. */}
          <CategoryFormDialog triggerLabel="Criar primeira categoria" />
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              products={category.products}
              allCategories={categoryOptions}
              allProducts={allProducts}
              isFirst={index === 0}
              isLast={index === categories.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
