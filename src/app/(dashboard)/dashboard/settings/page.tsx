import type { Metadata } from "next";

import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { pageTitle } from "@/config/brand";
import { RestaurantSettingsForm } from "@/components/dashboard/restaurant-settings-form";
import { PageHelp } from "@/components/dashboard/page-help";
import { IfoodIntegrationCard } from "@/components/dashboard/IfoodIntegrationCard";
import { NfeIntegrationCard } from "@/components/dashboard/NfeIntegrationCard";

export const metadata: Metadata = {
  title: pageTitle("Configurações"),
};

export default async function SettingsPage() {
  const restaurant = await getEffectiveRestaurant();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-1 text-2xl font-semibold tracking-tight text-white">
          Configurações
          <PageHelp page="settings" />
        </h1>
        <p className="text-muted-foreground">
          Edite a identidade do seu restaurante — nome, contato e logo.
        </p>
      </div>

      <RestaurantSettingsForm
        restaurant={{
          name: restaurant!.name,
          phone: restaurant!.phone,
          address: restaurant!.address,
          description: restaurant!.description,
          logoUrl: restaurant!.logoUrl,
        }}
      />

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Integrações
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Conecte o GreyPack a outras plataformas que você já usa.
        </p>
        <div className="flex flex-col gap-4">
          <IfoodIntegrationCard />
          <NfeIntegrationCard />
        </div>
      </div>
    </div>
  );
}
