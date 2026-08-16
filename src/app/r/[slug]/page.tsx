import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, UtensilsCrossed } from "lucide-react";

import { getPublicMenuBySlug } from "@/lib/restaurant";
import { cn } from "@/lib/utils";
import { pageTitle } from "@/config/brand";
import { DarkPortalRoot } from "@/components/theme/dark-portal-root";
import { MenuClient } from "./menu-client";

export async function generateMetadata(
  props: PageProps<"/r/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const restaurant = await getPublicMenuBySlug(slug);
  return {
    title: restaurant ? pageTitle(restaurant.name) : "Cardápio não encontrado",
  };
}

export default async function PublicMenuPage(props: PageProps<"/r/[slug]">) {
  const { slug } = await props.params;
  // Uma consulta só (restaurante + categorias + produtos + complementos) —
  // `cache()` em getPublicMenuBySlug garante que essa mesma chamada,
  // repetida aqui e em generateMetadata acima, vira 1 ida ao banco só, não
  // 2. Ver comentário na definição da função.
  const restaurant = await getPublicMenuBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const categoriesWithProducts = restaurant.categories.filter(
    (c) => c.products.length > 0
  );

  return (
    // `min-h-dvh` (dynamic viewport height) em vez de `min-h-screen`
    // (100vh fixo): no Chrome/Safari mobile e em WebViews de leitor de QR
    // Code, a barra de endereço mostra/esconde ao rolar e muda a altura
    // visível real — `100vh` fica "preso" na medida inicial, sobrando um
    // bloco branco (ou cortando conteúdo) quando a barra reaparece.
    // `100dvh` acompanha essa mudança automaticamente. `overflow-x-hidden`
    // é rede de segurança contra qualquer filho que vaze da largura da
    // tela (o cardápio já não tinha isso antes, mas outras páginas do
    // projeto — ver src/app/page.tsx — já usam o mesmo padrão).
    <DarkPortalRoot className="dark relative min-h-dvh w-full overflow-x-hidden bg-background text-foreground">
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
          {/* Logo do lojista em destaque no topo do cardápio — substitui o
              ícone genérico assim que ele faz upload em Configurações
              (mesmo formato de imagem armazenada em Restaurant.logoUrl das
              fotos de produto). Sem logo, mantém o selo genérico de sempre,
              sem nenhuma mudança visual pra quem ainda não configurou. */}
          {restaurant.logoUrl ? (
            <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-orange-600/20 ring-1 ring-white/10">
              <Image
                src={restaurant.logoUrl}
                alt={restaurant.name}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            </span>
          ) : (
            <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 shadow-xl shadow-orange-600/30 ring-1 ring-white/10">
              <UtensilsCrossed className="size-7 text-white" strokeWidth={2} />
            </span>
          )}
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
            restaurantPhone={restaurant.phone}
            isOpen={restaurant.isOpen}
            categories={categoriesWithProducts}
          />
        )}
      </div>
    </DarkPortalRoot>
  );
}
