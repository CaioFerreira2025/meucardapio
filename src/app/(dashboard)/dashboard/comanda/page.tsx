import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { pageTitle } from "@/config/brand";
import { ComandaClient } from "@/components/comanda/comanda-client";
import { PaywallScreen } from "@/components/billing/paywall-screen";
import { getAccessState } from "@/lib/access";
import { PageHelp } from "@/components/dashboard/page-help";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Smartphone } from "lucide-react";

export const metadata: Metadata = {
  title: pageTitle("Comanda"),
};

export default async function ComandaPage() {
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
        <h1 className="flex items-center gap-1 text-2xl font-semibold tracking-tight text-white">
          Comanda
          <PageHelp page="comanda" />
        </h1>
        <p className="text-muted-foreground">
          Lance o pedido do cliente direto da mesa — vai para a cozinha na hora.
        </p>
      </div>

      {categoriesWithProducts.length === 0 ? (
        // Comanda sem produtos disponíveis não tem o que lançar. O caminho é
        // sempre o mesmo — cadastrar no Cardápio —, então é para lá que o
        // botão aponta, em vez de deixar uma tela de abas vazias.
        <EmptyState
          icon={Smartphone}
          title="Cadastre produtos para lançar comandas"
          description="A comanda serve para o garçom lançar o pedido da mesa direto pelo painel, sem passar pelo celular do cliente. Para isso, é preciso ter pelo menos um produto disponível no cardápio."
          action={{ label: "Ir para o Cardápio", href: "/dashboard/menu" }}
        />
      ) : (
        <ComandaClient categories={categoriesWithProducts} />
      )}
    </div>
  );
}
