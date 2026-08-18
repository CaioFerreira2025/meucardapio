import type { LucideIcon } from "lucide-react";
import { BarChart3, Bike, Clock, ClipboardCopy, TicketPercent } from "lucide-react";

/**
 * ============================================================================
 * REGISTRO DE MÓDULOS SOB DEMANDA — metadados
 * ============================================================================
 *
 * Aqui mora só a FICHA de cada módulo: chave, nome, descrição e ícone. O que
 * carrega a tela de verdade fica em `src/modules/loader.ts`, e a separação é
 * proposital (explicada no fim deste comentário).
 *
 * ── Como criar um módulo novo ───────────────────────────────────────────────
 *
 *  1. Crie a pasta `src/modules/<chave>/` com um `page.tsx` que exporte
 *     `default` um componente async recebendo `ModulePageProps`.
 *  2. Adicione uma entrada em MODULES abaixo.
 *  3. Adicione a mesma chave em MODULE_LOADERS, em `src/modules/loader.ts`.
 *  4. Ligue para o cliente no Painel Administrativo.
 *
 * Não há passo 5: nada de criar rota, mexer no menu ou rodar migração.
 *
 * ── Por que os dois arquivos são separados ──────────────────────────────────
 *
 * Este arquivo é importado em vários lugares (menu lateral, Painel
 * Administrativo, `src/lib/modules.ts`) — inclusive por caminhos que acabam
 * no pacote JavaScript do CARDÁPIO PÚBLICO, porque a Server Action que cria o
 * pedido também precisa saber quais módulos estão ligados.
 *
 * Enquanto os `import()` das telas moravam aqui, o empacotador enxergava esse
 * caminho e arrastava junto o código das telas do painel: medindo o que o
 * navegador baixava, o formulário de cupons e a agenda de horários chegavam
 * em TODA página do painel — e até no cardápio público, que o cliente final
 * abre pelo QR Code. Exatamente o contrário do que "módulo sob demanda"
 * promete.
 *
 * Com os `import()` isolados em `loader.ts`, importado só pela rota
 * /dashboard/m/[module], o código de um módulo só desce para quem abre a tela
 * daquele módulo — e nunca para quem não contratou.
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
   * Módulo sem tela própria: aparece no Painel Administrativo para ligar e
   * desligar, mas não vira item de menu no painel do lojista. Usado por
   * módulos que só injetam um comportamento numa tela que já existe.
   */
  hidden?: boolean;
};

export const MODULES: ModuleDefinition[] = [
  {
    key: "relatorios",
    name: "Relatórios",
    shortLabel: "Relat.",
    description:
      "Relatório de vendas por período, com faturamento, ticket médio e ranking de produtos.",
    icon: BarChart3,
  },
  {
    key: "entregas",
    name: "Entregas",
    description:
      "Cadastro de bairros com taxa de entrega fixa, calculada automaticamente no carrinho do cliente.",
    icon: Bike,
  },
  {
    key: "horarios",
    name: "Horários",
    description:
      "Agenda de funcionamento por dia da semana — o cardápio abre e fecha sozinho, sem pedido fora de hora.",
    icon: Clock,
  },
  {
    key: "copiar-pedido",
    name: "Copiar pedido",
    // Único módulo sem tela própria: ele injeta um botão na Central de
    // pedidos. `hidden` mantém a chave fora do menu lateral — ver toNavItems.
    description:
      "Botão na Central de pedidos que copia o resumo formatado, pronto para colar no WhatsApp da cozinha.",
    icon: ClipboardCopy,
    hidden: true,
  },
  {
    key: "cupons",
    name: "Cupons",
    description:
      "Códigos promocionais (percentual ou valor fixo) que o cliente aplica no carrinho.",
    icon: TicketPercent,
  },
];

export function getModule(key: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.key === key);
}

/** Só o que é seguro mandar para um client component (sem ícone nem load). */
export type ModuleNavItem = {
  key: string;
  name: string;
  shortLabel?: string;
};

export function toNavItems(keys: string[]): ModuleNavItem[] {
  return keys
    .map((key) => getModule(key))
    .filter((m): m is ModuleDefinition => Boolean(m) && !m!.hidden)
    .map((m) => ({ key: m.key, name: m.name, shortLabel: m.shortLabel }));
}
