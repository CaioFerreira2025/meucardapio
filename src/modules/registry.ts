import type { LucideIcon } from "lucide-react";
import { BarChart3 } from "lucide-react";

/**
 * ============================================================================
 * REGISTRO DE MÓDULOS SOB DEMANDA
 * ============================================================================
 *
 * Este é o ÚNICO arquivo que precisa ser tocado para criar um módulo novo.
 * O resto do painel (menu lateral, rota, permissão, tela de admin) se
 * adapta sozinho a partir do que está declarado aqui.
 *
 * ── Como criar um módulo novo ───────────────────────────────────────────────
 *
 *  1. Crie a pasta `src/modules/<chave>/` com um `page.tsx` que exporte
 *     `default` um componente async recebendo `ModulePageProps`.
 *  2. Adicione uma entrada em MODULES abaixo.
 *  3. Ligue para o cliente no Painel Administrativo.
 *
 * Não há passo 4: nada de criar rota, mexer no menu ou rodar migração.
 *
 * ── Por que isso não afeta os outros clientes ───────────────────────────────
 *
 * `load` é uma função que só é CHAMADA quando o módulo está ligado para
 * aquele restaurante. O bundler transforma cada `import()` dinâmico num
 * arquivo JavaScript separado, então o painel de um cliente sem o módulo
 * nunca baixa nem executa aquele código. Um erro dentro de
 * `src/modules/relatorios/` não tem como derrubar o painel de quem não tem
 * o módulo de relatórios — o arquivo sequer chega no navegador dele.
 *
 * É por isso que `load` é uma função e não um import direto no topo deste
 * arquivo: um import estático colocaria TODOS os módulos no mesmo pacote e
 * jogaria fora justamente a garantia de isolamento.
 */

export type ModulePageProps = {
  /** Restaurante dono do painel onde o módulo está sendo exibido. */
  restaurantId: string;
  restaurantName: string;
};

export type ModuleDefinition = {
  /** Chave estável — é o que vai gravado no banco. Nunca renomeie. */
  key: string;
  /** Nome exibido no menu e no Painel Administrativo. */
  name: string;
  /** Uma frase para o admin lembrar o que o módulo faz ao ligar/desligar. */
  description: string;
  icon: LucideIcon;
  /** Rótulo curto para a barra inferior do mobile, se o nome for longo. */
  shortLabel?: string;
  /**
   * Carregamento sob demanda. Assinatura de função (e não import estático)
   * é o que garante o code splitting — ver explicação no topo.
   */
  load: () => Promise<{
    default: (props: ModulePageProps) => Promise<React.ReactElement> | React.ReactElement;
  }>;
};

export const MODULES: ModuleDefinition[] = [
  {
    key: "relatorios",
    name: "Relatórios",
    shortLabel: "Relat.",
    description:
      "Relatório de vendas por período, com faturamento, ticket médio e ranking de produtos.",
    icon: BarChart3,
    load: () => import("@/modules/relatorios/page"),
  },
];

export function getModule(key: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.key === key);
}

/** Só o que é seguro mandar para um client component (sem a função `load`). */
export type ModuleNavItem = {
  key: string;
  name: string;
  shortLabel?: string;
};

export function toNavItems(keys: string[]): ModuleNavItem[] {
  return keys
    .map((key) => getModule(key))
    .filter((m): m is ModuleDefinition => Boolean(m))
    .map((m) => ({ key: m.key, name: m.name, shortLabel: m.shortLabel }));
}
