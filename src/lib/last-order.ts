// Guarda o último pedido feito pelo cliente numa loja (não é um
// "login"/cadastro de verdade — o cardápio público não tem isso), só pra
// dar continuidade entre visitas no MESMO navegador:
// - pré-preencher nome/telefone/mesa no próximo pedido (menu-client.tsx);
// - oferecer um atalho de volta pro acompanhamento do último pedido (aba
//   "Conta" do menu inferior);
// - identificar a "sessão" da mesa pro ActiveOrderPanel: se o cliente
//   reabrir o cardápio (ou escanear o QR Code de novo) com esse pedido
//   ainda ativo, o painel flutuante de status aparece sozinho.
//
// Compartilhado entre menu-client.tsx e active-order-panel.tsx pra não ter
// duas cópias da mesma leitura/escrita de localStorage divergindo com o
// tempo.

/**
 * Validade da sessão de mesa: 3 horas.
 *
 * Sem isso, o registro ficava no localStorage para sempre — e o cartão
 * "Você já tem um pedido nesta mesa" reaparecia dias depois, para um
 * cliente que já tinha ido embora, sobre um pedido já entregue.
 *
 * Três horas cobrem com folga a refeição mais demorada e, ao mesmo tempo,
 * garantem que ninguém volte no dia seguinte e encontre a sessão de véspera.
 */
export const TABLE_SESSION_TTL_MS = 3 * 60 * 60 * 1000;

export type LastOrderInfo = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  tableNumber: string;
  /**
   * Quando este registro foi gravado (epoch ms). É o que permite expirar a
   * sessão sem depender de rede: um cliente que volta no dia seguinte tem o
   * registro descartado já na leitura, antes de qualquer chamada à API.
   */
  savedAt?: number;
};

function lastOrderStorageKey(slug: string) {
  return `cardapio:${slug}:lastOrder`;
}

export function clearLastOrder(slug: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(lastOrderStorageKey(slug));
  } catch {
    // localStorage indisponível — nada a limpar de qualquer forma.
  }
}

/** Verdadeiro quando o registro passou da validade da sessão de mesa. */
export function isLastOrderExpired(
  info: Pick<LastOrderInfo, "savedAt">,
  now: number = Date.now()
): boolean {
  // Registro sem `savedAt` vem de ANTES desta regra existir — ou seja, é
  // exatamente o tipo de sessão presa que motivou o TTL. Tratado como
  // expirado de propósito: o custo é um cliente que esteja com um pedido em
  // andamento neste exato momento perder o cartão flutuante (ele continua
  // acompanhando o pedido pelo link normalmente), e o ganho é toda sessão
  // velha em campo ser limpa no primeiro acesso depois da atualização.
  if (typeof info.savedAt !== "number") return true;

  // Data no futuro (relógio do aparelho errado, adiantado) também é
  // descartada: confiar nela deixaria a sessão presa por ainda mais tempo,
  // que é o oposto do que queremos.
  if (info.savedAt > now) return true;

  return now - info.savedAt > TABLE_SESSION_TTL_MS;
}

/**
 * Lê a sessão de mesa deste navegador. Devolve `null` — e LIMPA o registro —
 * quando ele já passou da validade, para o mesmo lixo não ser reavaliado a
 * cada carregamento de página.
 */
export function readLastOrder(slug: string): LastOrderInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(lastOrderStorageKey(slug));
    if (!raw) return null;

    const info = JSON.parse(raw) as LastOrderInfo;
    if (!info?.orderId) return null;

    if (isLastOrderExpired(info)) {
      clearLastOrder(slug);
      return null;
    }

    return info;
  } catch {
    return null;
  }
}

export function writeLastOrder(slug: string, info: LastOrderInfo) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      lastOrderStorageKey(slug),
      // `savedAt` é carimbado aqui, e não por quem chama, para que nenhuma
      // gravação futura esqueça dele e crie uma sessão imortal de novo.
      JSON.stringify({ ...info, savedAt: info.savedAt ?? Date.now() })
    );
  } catch {
    // localStorage indisponível (modo privado, quota etc.) — não é
    // crítico, é só uma conveniência de continuidade entre visitas.
  }
}
