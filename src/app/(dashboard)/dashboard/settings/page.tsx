import type { Metadata } from "next";

import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { pageTitle } from "@/config/brand";
import { RestaurantSettingsForm } from "@/components/dashboard/restaurant-settings-form";

export const metadata: Metadata = {
  title: pageTitle("Configurações"),
};

export default async function SettingsPage() {
  const restaurant = await getEffectiveRestaurant();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Configurações
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
    </div>
  );
}
