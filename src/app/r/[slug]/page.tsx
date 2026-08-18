import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, UtensilsCrossed } from "lucide-react";

import { getPublicMenuBySlug } from "@/lib/restaurant";
import { cn } from "@/lib/utils";
import { pageTitle } from "@/config/brand";
import { DarkPortalRoot } from "@/components/theme/dark-portal-root";
import { MenuClient } from "./menu-client";
import { prisma } from "@/lib/prisma";
import { getEnabledModuleKeys } from "@/lib/modules";
import { isWithinBusinessHours, nowInRestaurantTimezone } from "@/modules/shared";

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

  // ===== Módulos sob demanda no cardápio público =====
  //
  // Resolvidos no SERVIDOR: um restaurante sem o módulo nem recebe os dados
  // dele no HTML, então não há como o campo de bairro ou de cupom aparecer
  // para quem não contratou.
  const moduleKeys = await getEnabledModuleKeys(restaurant.id);
  const hasEntregas = moduleKeys.includes("entregas");
  const hasHorarios = moduleKeys.includes("horarios");
  const hasCupons = moduleKeys.includes("cupons");

  const [deliveryZones, businessHours] = await Promise.all([
    hasEntregas
      ? prisma.deliveryZone.findMany({
          where: { restaurantId: restaurant.id },
          orderBy: [{ position: "asc" }, { neighborhood: "asc" }],
          select: { id: true, neighborhood: true, feeCents: true },
        })
      : Promise.resolve([]),
    hasHorarios
      ? prisma.businessHour.findMany({
          where: { restaurantId: restaurant.id },
          select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
        })
      : Promise.resolve([]),
  ]);

  // A loja está aberta quando o interruptor manual do lojista está ligado E,
  // se o módulo de horários estiver ativo, o momento atual cai dentro da
  // agenda. O interruptor manual continua valendo como fechamento de
  // emergência — dá para fechar no meio do expediente sem mexer na agenda.
  const openBySchedule = hasHorarios
    ? isWithinBusinessHours(businessHours, nowInRestaurantTimezone())
    : true;
  const isOpen = restaurant.isOpen && openBySchedule;
  // Fechado POR HORÁRIO (e não porque o lojista desligou) — muda o texto do
  // selo e do aviso: "volte mais tarde" em vez de "não estamos aceitando
  // pedidos", que soa como fechado de vez.
  const closedBySchedule = restaurant.isOpen && !openBySchedule;

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
      {/* Mesmo tratamento de fundo da landing: facho de luz + vinheta, sem
          blur. Aqui isso importa ainda mais do que lá — esta é a tela que o
          cliente do restaurante abre no celular, muitas vezes em aparelho
          simples, e dois círculos de 28rem com blur de 130px custam caro
          para compor a cada rolagem. */}
      <div
        aria-hidden
        className="light-spot pointer-events-none fixed inset-0 overflow-hidden"
      />
      <div aria-hidden className="vignette pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col px-4 sm:px-6">
        {/* Hero do restaurante */}
        <header className="flex flex-col items-center gap-3 pt-10 pb-6 text-center sm:pt-14">
          {/* Logo do lojista em destaque no topo do cardápio — substitui o
              ícone genérico assim que ele faz upload em Configurações
              (mesmo formato de imagem armazenada em Restaurant.logoUrl das
              fotos de produto). Sem logo, mantém o selo genérico de sempre,
              sem nenhuma mudança visual pra quem ainda não configurou. */}
          {restaurant.logoUrl ? (
            <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-brand-800/20 ring-1 ring-white/10">
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
            <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-xl shadow-brand-800/30 ring-1 ring-white/10">
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
          {/* Selo aberto/fechado: usa o estado EFETIVO (`isOpen`), que já
              combina a chave manual do lojista com a agenda do módulo de
              horários. Usar `restaurant.isOpen` aqui deixaria o selo dizendo
              "Aberto agora" logo acima do aviso de que está fora do horário. */}
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1",
              isOpen
                ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                : "bg-rose-500/15 text-rose-300 ring-rose-500/25"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              )}
            />
            {isOpen
              ? "Aberto agora"
              : closedBySchedule
                ? "Fora do horário"
                : "Fechado no momento"}
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
            isOpen={isOpen}
            categories={categoriesWithProducts}
            deliveryZones={deliveryZones}
            couponsEnabled={hasCupons}
            closedBySchedule={closedBySchedule}
          />
        )}
      </div>
    </DarkPortalRoot>
  );
}
