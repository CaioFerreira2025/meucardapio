import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, UtensilsCrossed } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getRestaurantBySlug } from "@/lib/restaurant";
import { cn } from "@/lib/utils";
import { pageTitle } from "@/config/brand";
import { DarkPortalRoot } from "@/components/theme/dark-portal-root";
import { MenuClient } from "./menu-client";

export async function generateMetadata(
  props: PageProps<"/r/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const restaurant = await getRestaurantBySlug(slug);
  return {
    title: restaurant ? pageTitle(restaurant.name) : "Cardápio não encontrado",
  };
}

export default async function PublicMenuPage(props: PageProps<"/r/[slug]">) {
  const { slug } = await props.params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { position: "asc" },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { position: "asc" },
        include: {
          // "Venda mais" — só sugere complementares que também estão
          // disponíveis no momento.
          complements: {
            where: { isAvailable: true },
            select: { id: true, name: true, priceCents: true, imageUrl: true },
          },
        },
      },
    },
  });

  const categoriesWithProducts = categories.filter((c) => c.products.length > 0);

  return (
    <DarkPortalRoot className="dark relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-[-15%] left-1/4 h-[28rem] w-[28rem] rounded-full bg-orange-600/10 blur-[130px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-96 w-96 rounded-full bg-rose-600/[0.07] blur-[120px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col px-4 sm:px-6">
        {/* Hero do restaurante */}
        <header className="flex flex-col items-center gap-3 pt-10 pb-6 text-center sm:pt-14">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 shadow-xl shadow-orange-600/30 ring-1 ring-white/10">
            <UtensilsCrossed className="size-7 text-white" strokeWidth={2} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="max-w-md text-sm text-muted-foreground">
              {restaurant.description}
            </p>
          )}
          {restaurant.address && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {restaurant.address}
            </p>
          )}
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1",
              restaurant.isOpen
                ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                : "bg-rose-500/15 text-rose-300 ring-rose-500/25"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                restaurant.isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              )}
            />
            {restaurant.isOpen ? "Aberto agora" : "Fechado no momento"}
          </span>
        </header>

        {categoriesWithProducts.length === 0 ? (
          <p className="pb-16 text-center text-muted-foreground">
            Este cardápio ainda não tem produtos disponíveis.
          </p>
        ) : (
          <MenuClient
            slug={restaurant.slug}
            restaurantName={restaurant.name}
            isOpen={restaurant.isOpen}
            categories={categoriesWithProducts}
          />
        )}
      </div>
    </DarkPortalRoot>
  );
}
