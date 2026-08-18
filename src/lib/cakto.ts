import { timingSafeEqual } from "node:crypto";

import { toInternationalPhone } from "@/lib/identity";

// Integração com a Cakto — gateway de pagamentos (Pix, cartão de crédito e
// débito) que substitui a integração anterior com o Stripe.
//
// Fluxo de cobrança: o botão "Assinar" redireciona o dono do restaurante
// para o checkout hospedado da própria Cakto (getCaktoCheckoutUrl) — Pix,
// crédito e débito são processados lá, sem passar dado de cartão pelo
// nosso servidor. Quando o pagamento é aprovado / a assinatura muda de
// status, a Cakto chama o nosso webhook (ver
// src/app/api/webhooks/cakto/route.ts). A API autenticada (caktoFetch) é
// usada só para uma coisa hoje: cancelar assinatura a pedido do usuário
// (ver src/app/api/subscription/cancel/route.ts).
const CAKTO_API_BASE = "https://api.cakto.com.br/public_api";

const clientId = process.env.CAKTO_CLIENT_ID;
const clientSecret = process.env.CAKTO_CLIENT_SECRET;

export const isCaktoConfigured = Boolean(clientId && clientSecret);

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// A Cakto usa OAuth2 client-credentials e não expõe endpoint de refresh —
// pedimos um access token novo sempre que o anterior expirou (ou está perto
// disso). Cacheado em memória do processo entre chamadas; em cold start de
// função serverless simplesmente pedimos um novo, sem problema.
async function getAccessToken(): Promise<string> {
  if (!clientId || !clientSecret) {
    throw new Error(
      "Cakto não está configurada (defina CAKTO_CLIENT_ID e CAKTO_CLIENT_SECRET no .env)."
    );
  }

  if (cachedToken && cachedToken.expiresAt - Date.now() > 60_000) {
    return cachedToken.accessToken;
  }

  const response = await fetch(`${CAKTO_API_BASE}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao autenticar na Cakto (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.accessToken;
}

// Wrapper autenticado para chamadas à API da Cakto.
export async function caktoFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  return fetch(`${CAKTO_API_BASE}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

// URL do checkout hospedado da Cakto para uma oferta (plano) específica.
// `email`/`name` pré-preenchem o formulário do checkout (parâmetros
// documentados pela Cakto: ver "checkout pré-preenchido") — importante
// porque é o e-mail informado ali que volta no webhook (`data.customer.email`)
// e é como casamos o pagamento com o usuário certo do nosso sistema.
export function getCaktoCheckoutUrl(
  offerId: string,
  customer: {
    email: string;
    name?: string | null;
    /** CPF/CNPJ só com dígitos (ver src/lib/identity.ts). */
    document?: string | null;
    /** Celular só com dígitos, SEM o 55 — adicionado aqui. */
    phone?: string | null;
    /** Id do usuário no nosso banco, para casar o webhook com a conta. */
    userId?: string | null;
  }
): string {
  const url = new URL(`https://pay.cakto.com.br/${offerId}`);
  url.searchParams.set("email", customer.email);
  if (customer.name) {
    url.searchParams.set("name", customer.name);
  }
  // Pré-preencher documento e telefone tem dois efeitos: menos fricção no
  // checkout e, principalmente, mais chance de o payload do webhook voltar
  // com os MESMOS valores que temos no banco — que é como identificamos a
  // conta quando o cliente paga usando outro e-mail (ver a cascata de
  // identificação em src/app/api/webhooks/cakto/route.ts).
  if (customer.document) {
    url.searchParams.set("cpf", customer.document);
  }
  if (customer.phone) {
    url.searchParams.set("phone", toInternationalPhone(customer.phone));
  }
  // `src` é o parâmetro de rastreamento do checkout da Cakto. Levamos o id
  // do usuário nele porque é o único identificador que NÃO depende do que a
  // pessoa digita na tela de pagamento — e-mail, CPF e telefone o comprador
  // pode trocar na hora; este valor não.
  if (customer.userId) {
    url.searchParams.set("src", `uid_${customer.userId}`);
  }
  return url.toString();
}

/**
 * Extrai o id do usuário de um valor de rastreamento (`src`/`sck`) gerado
 * por getCaktoCheckoutUrl. Devolve `undefined` para qualquer coisa que não
 * siga o formato — inclusive valores de campanha de marketing que o lojista
 * venha a usar nesses mesmos parâmetros.
 */
export function parseUserIdFromTracking(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.match(/\buid_([a-z0-9]+)\b/i);
  return match?.[1];
}

// Cada webhook cadastrado no painel da Cakto é vinculado a um ou mais
// produtos (Starter, Pro, ...) e recebe seu próprio `secret` — um UUID
// GERADO AUTOMATICAMENTE pela Cakto (não é possível escolher o valor,
// só copiar o que aparece na tela após criar o webhook lá:
// https://docs.cakto.com.br/api-reference/webhooks/retrieve). Ou seja, se
// Starter e Pro tiverem webhooks separados (mesma URL, cadastros
// diferentes), eles normalmente vêm com secrets DIFERENTES.
//
// Por isso aceitamos qualquer um dos secrets configurados, não só um:
// CAKTO_WEBHOOK_SECRET_STARTER e CAKTO_WEBHOOK_SECRET_PRO cobrem o caso de
// um webhook por plano; CAKTO_WEBHOOK_SECRET continua funcionando sozinho
// para quem cadastrou um único webhook cobrindo os dois produtos. Todos os
// valores configurados são válidos ao mesmo tempo — o evento já se
// autoidentifica pelo `offer.id`/`product.id` dentro do payload (ver
// getPlanByOfferId em src/config/plans.ts), então não precisamos (nem
// conseguimos, com segurança) inferir o plano a partir de qual secret bateu.
function getConfiguredCaktoWebhookSecrets(): string[] {
  return [
    process.env.CAKTO_WEBHOOK_SECRET,
    process.env.CAKTO_WEBHOOK_SECRET_STARTER,
    process.env.CAKTO_WEBHOOK_SECRET_PRO,
  ].filter((value): value is string => Boolean(value));
}

// A Cakto não assina o payload com HMAC — a autenticidade é garantida só
// pelo `secret` vindo no corpo do JSON, então comparamos com
// timingSafeEqual (por secret candidato) para evitar timing attack, como a
// própria documentação recomenda.
export function isValidCaktoWebhookSecret(received: unknown): boolean {
  if (typeof received !== "string" || !received) return false;

  const receivedBuffer = Buffer.from(received);
  const configuredSecrets = getConfiguredCaktoWebhookSecrets();

  return configuredSecrets.some((expected) => {
    const expectedBuffer = Buffer.from(expected);
    if (receivedBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(receivedBuffer, expectedBuffer);
  });
}
