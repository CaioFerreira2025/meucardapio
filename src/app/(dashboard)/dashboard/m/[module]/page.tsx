import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { getAccessState } from "@/lib/access";
import { isModuleEnabled } from "@/lib/modules";
import { getModule } from "@/modules/registry";
import { getModuleLoader } from "@/modules/loader";
import { pageTitle } from "@/config/brand";
import { PaywallScreen } from "@/components/billing/paywall-screen";
import { PageHelp } from "@/components/dashboard/page-help";

// Rota única que serve TODOS os módulos sob demanda, presentes e futuros.
//
// É o que faz criar um módulo não exigir criar rota: `[module]` é a chave do
// registro, e o componente vem de `load()`. Um módulo novo nasce acessível em
// /dashboard/m/<chave> sem nenhum arquivo de rota adicional.
//
// Ordem das checagens (de barato para caro, e do mais geral para o mais
// específico):
//   1. o módulo existe no registro?      -> 404
//   2. a assinatura está em dia?         -> paywall
//   3. está ligado PARA ESTE cliente?    -> 404
//
// O passo 3 devolve 404, e não 403, de propósito: para quem não contratou, o
// módulo simplesmente não existe. Um "acesso negado" anunciaria a existência
// de um recurso que o cliente não deveria nem saber que existe.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module: moduleKey } = await params;
  const found = getModule(moduleKey);
  return { title: pageTitle(found?.name ?? "Módulo") };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleKey } = await params;

  const definition = getModule(moduleKey);
  if (!definition) notFound();

  const access = await getAccessState();
  if (!access.hasFullAccess) {
    return <PaywallScreen state={access} />;
  }

  const restaurant = await getEffectiveRestaurant();
  if (!restaurant) notFound();

  // Autorização no servidor. Esconder o item do menu não basta: sem isto,
  // qualquer cliente que digitasse a URL abriria o módulo de outro.
  const enabled = await isModuleEnabled(restaurant.id, definition.key);
  if (!enabled) notFound();

  // Só AQUI o código do módulo é carregado — e só para quem tem direito.
  // O carregador mora num arquivo à parte (src/modules/loader.ts) importado
  // exclusivamente por esta rota; ver o comentário lá para o porquê.
  const load = getModuleLoader(definition.key);
  if (!load) notFound();
  const { default: ModuleView } = await load();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400/20 to-brand-500/20 ring-1 ring-brand-500/25">
              <definition.icon className="size-4 text-brand-300" />
            </span>
            {definition.name}
            <PageHelp page="module" />
          </h1>
          <p className="text-muted-foreground">{definition.description}</p>
        </div>
      </div>

      <ModuleView restaurantId={restaurant.id} restaurantName={restaurant.name} />
    </div>
  );
}
