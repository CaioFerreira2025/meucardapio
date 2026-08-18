import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isValidCaktoWebhookSecret, parseUserIdFromTracking } from "@/lib/cakto";
import { onlyDigits, parsePhone } from "@/lib/identity";

// Substitui o antigo /api/webhooks/stripe. A Cakto não assina o payload
// (sem HMAC/header de assinatura) — a autenticidade vem só do campo
// `secret` no corpo, validado contra qualquer um dos secrets configurados
// (CAKTO_WEBHOOK_SECRET / CAKTO_WEBHOOK_SECRET_STARTER /
// CAKTO_WEBHOOK_SECRET_PRO — ver isValidCaktoWebhookSecret em
// src/lib/cakto.ts, que cobre tanto um único webhook pra todos os planos
// quanto um webhook por plano, cada um com seu próprio secret). Mesma URL
// pra todos os webhooks cadastrados na Cakto: o plano de cada evento é
// identificado pelo `offer.id`/`product.id` do payload, não pelo secret
// usado pra autenticar. Documentação: https://docs.cakto.com.br/conceitos/webhooks
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

// Identifica de qual conta é o pagamento, tentando na ordem do mais
// confiável para o menos.
//
// Por que não basta o e-mail: o checkout da Cakto é uma página deles, e o
// comprador pode digitar QUALQUER e-mail lá — o pessoal costuma usar o
// e-mail pessoal em vez do que cadastrou no painel. Quando isso acontecia,
// o webhook não achava a conta, ninguém era liberado, e a ativação virava
// trabalho manual no WhatsApp. Esta cascata existe para eliminar isso.
async function findUserForPayment(data: unknown) {
  // 1. `src`/`sck`: o parâmetro de rastreamento que NÓS colocamos na URL do
  //    checkout (ver getCaktoCheckoutUrl). É o único que o comprador não
  //    digita e portanto não erra.
  const tracking =
    parseUserIdFromTracking(pick(data, ["src", "sck", "tracking", "utm_source"])) ??
    parseUserIdFromTracking(pick(pick(data, ["tracking"]), ["src", "sck"])) ??
    parseUserIdFromTracking(pick(pick(data, ["purchase"]), ["src", "sck", "checkoutUrl"])) ??
    parseUserIdFromTracking(pick(data, ["checkoutUrl"]));
  if (tracking) {
    const byTracking = await prisma.user.findUnique({ where: { id: tracking } });
    if (byTracking) return { user: byTracking, matchedBy: "rastreamento (src)" };
  }

  const customer = pick(data, ["customer"]);

  // 2. E-mail — o caminho normal quando a pessoa não troca nada.
  const emailRaw = pick(customer, ["email"]);
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) return { user: byEmail, matchedBy: "e-mail" };
  }

  // 3. CPF/CNPJ — a Cakto exige documento na compra, e nós passamos o do
  //    cadastro pré-preenchido, então costuma bater.
  const documentRaw = pick(customer, ["docNumber", "doc_number", "document", "cpf", "cnpj"]);
  if (typeof documentRaw === "string") {
    const document = onlyDigits(documentRaw);
    if (document) {
      const byDocument = await prisma.user.findUnique({ where: { document } });
      if (byDocument) return { user: byDocument, matchedBy: "CPF/CNPJ" };
    }
  }

  // 4. Telefone — último recurso, normalizado para o mesmo formato do banco.
  const phoneRaw = pick(customer, ["phone", "phoneNumber", "phone_number", "whatsapp"]);
  if (typeof phoneRaw === "string") {
    const parsedPhone = parsePhone(phoneRaw);
    if (parsedPhone.ok) {
      const byPhone = await prisma.user.findUnique({ where: { phone: parsedPhone.digits } });
      if (byPhone) return { user: byPhone, matchedBy: "WhatsApp" };
    }
  }

  return { user: null, matchedBy: null, email };
}

async function syncSubscription(eventName: string, status: string, data: unknown) {
  const match = await findUserForPayment(data);
  const user = match.user;

  if (!user) {
    console.error(
      `[cakto-webhook] evento "${eventName}": não foi possível identificar a conta por ` +
        `rastreamento, e-mail, CPF/CNPJ nem telefone. Nenhum acesso foi liberado — ` +
        `verifique manualmente no painel administrativo. Payload:`,
      JSON.stringify(data)
    );
    return;
  }

  console.log(
    `[cakto-webhook] evento "${eventName}" associado ao usuário ${user.email} via ${match.matchedBy}.`
  );

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
