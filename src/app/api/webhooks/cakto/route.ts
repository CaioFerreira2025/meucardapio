import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isValidCaktoWebhookSecret } from "@/lib/cakto";

// Substitui o antigo /api/webhooks/stripe. A Cakto não assina o payload
// (sem HMAC/header de assinatura) — a autenticidade vem só do campo
// `secret` no corpo, validado contra CAKTO_WEBHOOK_SECRET (ver
// src/lib/cakto.ts). Documentação: https://docs.cakto.com.br/conceitos/webhooks
//
// Mapeamos o status local (mesmo vocabulário que já era usado com o
// Stripe: active/past_due/canceled/paused) a partir do NOME do evento, não
// de um campo "status" dentro do payload — o nome do evento é a parte mais
// bem documentada/estável da API da Cakto; o formato exato dos campos
// aninhados (subscription.next_payment_date etc.) não está 100% confirmado
// até recebermos um evento real, por isso a extração abaixo é defensiva
// (várias grafias possíveis) e nunca derruba a request por payload
// inesperado — sempre responde 200 depois de tentar o melhor possível, com
// log detalhado quando algo não bate, para dar pra depurar contra o evento
// de teste real (a própria Cakto tem um botão de "enviar evento de teste"
// no cadastro do webhook).
const SUBSCRIPTION_STATUS_BY_EVENT: Record<string, string> = {
  subscription_created: "active",
  subscription_renewed: "active",
  subscription_resumed: "active",
  purchase_approved: "active",
  subscription_paused: "paused",
  subscription_renewal_refused: "past_due",
  subscription_canceled: "canceled",
};

// Eventos que a Cakto pode enviar mas que, por ora, só registramos (não
// mexem no status local) — reembolso/chargeback merecem tratamento próprio
// (ex.: suspender acesso imediatamente) e não foram implementados aqui de
// propósito: o formato exato do payload desses eventos não pôde ser
// confirmado na documentação disponível no momento da implementação, e
// blindly assumir um vínculo com a assinatura poderia derrubar acesso de
// alguém indevidamente. Ver aviso na resposta final ao usuário.
const ACKNOWLEDGED_ONLY_EVENTS = new Set([
  "purchase_refused",
  "refund",
  "chargeback",
  "initiate_checkout",
  "checkout_abandonment",
  "pix_gerado",
  "boleto_gerado",
  "picpay_gerado",
  "openfinance_nubank_gerado",
]);

function pick(obj: unknown, keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { secret, event, data } = body as {
    secret?: unknown;
    event?: unknown;
    data?: unknown;
  };

  if (!isValidCaktoWebhookSecret(secret)) {
    return NextResponse.json({ error: "Secret inválido." }, { status: 401 });
  }

  if (typeof event !== "string") {
    return NextResponse.json({ error: "Evento ausente." }, { status: 400 });
  }

  if (ACKNOWLEDGED_ONLY_EVENTS.has(event)) {
    return NextResponse.json({ received: true });
  }

  const status = SUBSCRIPTION_STATUS_BY_EVENT[event];
  if (!status) {
    // Evento que não conhecemos — apenas confirma o recebimento (2xx) para
    // a Cakto não ficar reentregando; não há o que sincronizar.
    return NextResponse.json({ received: true });
  }

  await syncSubscription(event, status, data);

  return NextResponse.json({ received: true });
}

async function syncSubscription(eventName: string, status: string, data: unknown) {
  const emailRaw = pick(pick(data, ["customer"]), ["email"]);
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

  if (!email) {
    console.error(
      `[cakto-webhook] evento "${eventName}" sem customer.email — não dá para saber de qual usuário é. Payload:`,
      JSON.stringify(data)
    );
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `[cakto-webhook] nenhum usuário encontrado para o e-mail "${email}" (evento "${eventName}"). ` +
        `Confira se o e-mail usado no checkout da Cakto é o mesmo da conta no painel.`
    );
    return;
  }

  const offerIdRaw =
    pick(pick(data, ["offer"]), ["id"]) ?? pick(pick(data, ["product"]), ["id"]);
  const offerId = typeof offerIdRaw === "string" ? offerIdRaw : undefined;

  const subscriptionIdRaw =
    pick(pick(data, ["subscription"]), ["id"]) ?? pick(data, ["id"]);
  const caktoSubscriptionId =
    typeof subscriptionIdRaw === "string" ? subscriptionIdRaw : undefined;

  const nextPaymentRaw = pick(pick(data, ["subscription"]), [
    "next_payment_date",
    "nextPaymentDate",
    "current_period_end",
    "currentPeriodEnd",
  ]);
  const currentPeriodEnd =
    typeof nextPaymentRaw === "string" && !Number.isNaN(Date.parse(nextPaymentRaw))
      ? new Date(nextPaymentRaw)
      : null;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      caktoSubscriptionId,
      caktoOfferId: offerId,
      status,
      // Sem uma data de próxima cobrança confirmada no payload, assume 30
      // dias (todos os planos são mensais) — só afeta o texto "Renova em"
      // exibido; o próximo webhook de renovação corrige o valor.
      currentPeriodEnd: currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
    update: {
      caktoSubscriptionId,
      caktoOfferId: offerId,
      status,
      currentPeriodEnd: currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: false,
    },
  });
}
