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
export type LastOrderInfo = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  tableNumber: string;
};

function lastOrderStorageKey(slug: string) {
  return `cardapio:${slug}:lastOrder`;
}

export function readLastOrder(slug: string): LastOrderInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(lastOrderStorageKey(slug));
    return raw ? (JSON.parse(raw) as LastOrderInfo) : null;
  } catch {
    return null;
  }
}

export function writeLastOrder(slug: string, info: LastOrderInfo) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(lastOrderStorageKey(slug), JSON.stringify(info));
  } catch {
    // localStorage indisponível (modo privado, quota etc.) — não é
    // crítico, é só uma conveniência de continuidade entre visitas.
  }
}
