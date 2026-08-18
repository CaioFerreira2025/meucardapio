import type { ModulePageProps } from "@/modules/registry";

/**
 * ============================================================================
 * CARREGADOR DAS TELAS DOS MÓDULOS
 * ============================================================================
 *
 * Este arquivo deve ser importado por UM lugar só: a rota
 * `src/app/(dashboard)/dashboard/m/[module]/page.tsx`.
 *
 * O motivo é o empacotamento. `import()` é o que faz o empacotador colocar
 * cada tela num arquivo JavaScript separado, baixado só quando aquela tela é
 * aberta. Mas quem IMPORTA este arquivo entra nesse caminho: se ele fosse
 * importado pelo registro de metadados (usado no menu lateral, no Painel
 * Administrativo e pela Server Action que cria pedidos), o código das telas
 * do painel acabaria descendo em toda página do painel — e no cardápio
 * público, aberto pelo cliente final no celular.
 *
 * Isso não é teoria: foi medido. Antes desta separação, o formulário de
 * cupons e a agenda de horários eram baixados em /dashboard, /dashboard/menu
 * e até em /r/<slug>.
 *
 * Se um dia este import aparecer em outro arquivo, a garantia de isolamento
 * dos módulos morre em silêncio — nada quebra, o painel só fica mais pesado
 * para todo mundo.
 */

type ModuleLoader = () => Promise<{
  default: (props: ModulePageProps) => Promise<React.ReactElement> | React.ReactElement;
}>;

export const MODULE_LOADERS: Record<string, ModuleLoader> = {
  relatorios: () => import("@/modules/relatorios/page"),
  entregas: () => import("@/modules/entregas/page"),
  horarios: () => import("@/modules/horarios/page"),
  "copiar-pedido": () => import("@/modules/copiar-pedido/page"),
  cupons: () => import("@/modules/cupons/page"),
};

export function getModuleLoader(key: string): ModuleLoader | undefined {
  return MODULE_LOADERS[key];
}
