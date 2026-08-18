import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { getEffectiveRestaurantContext } from "@/lib/restaurant-context";
import { getPlanByOfferId, type Plan, type PlanPrice } from "@/config/plans";

// Dias de teste gratuito dados a toda conta nova (acesso equivalente ao
// plano Pro). Preenchido em `trialEndsAt` no cadastro — ver
// src/app/api/register/route.ts.
export const TRIAL_DAYS = 15;

// A partir de quantos dias restantes o aviso deixa de ser discreto e passa a
// ser amarelo ("está acabando").
export const TRIAL_ENDING_SOON_DAYS = 3;
export const SUBSCRIPTION_ENDING_SOON_DAYS = 5;

// Carência depois do fim do período pago antes de cortar o acesso. Existe
// para proteger quem PAGOU: se um webhook de renovação da Cakto atrasar ou
// se perder (a Cakto não assina o payload e reentrega em caso de erro — ver
// src/app/api/webhooks/cakto/route.ts), o cliente adimplente não pode ser
// barrado no minuto seguinte ao vencimento por uma falha nossa.
const RENEWAL_GRACE_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type AccessState = {
  // Única coisa que as telas precisam checar para liberar/bloquear conteúdo.
  hasFullAccess: boolean;
  kind:
    | "staff" // admin da plataforma ou modo suporte — nunca bloqueado
    | "subscribed" // assinatura ativa e paga
    | "trial" // dentro dos 15 dias de teste
    | "trial_expired" // teste acabou e nunca assinou
    | "trial_unavailable" // CPF/CNPJ ou WhatsApp já tinha usado o teste antes
    | "past_due" // assinatura existiu mas o pagamento falhou/pausou
    | "canceled"; // assinatura cancelada e período já encerrado
  // Data em que o acesso atual expira (fim do trial ou do período pago).
  // `null` quando não há prazo aplicável (staff, ou já expirado).
  endsAt: Date | null;
  // Dias inteiros restantes até `endsAt`; 0 quando já venceu ou não se aplica.
  daysLeft: number;
  // Verdadeiro quando falta pouco e vale avisar de forma mais chamativa.
  endingSoon: boolean;
  plan: Plan | undefined;
  /** Preço/ciclo efetivamente contratado (mensal, trimestral ou anual). */
  planPrice: PlanPrice | undefined;
};

function daysUntil(date: Date, now: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / DAY_MS));
}

// Fim do trial de um usuário. Contas criadas ANTES desta funcionalidade têm
// `trialEndsAt` nulo; para elas a data é derivada de `createdAt`, de forma
// que a regra "todo mundo tem 15 dias a partir do cadastro" valha igual para
// todos, sem precisar de coluna preenchida. (Na virada, rode
// `scripts/backfill-trial.mjs` para dar 15 dias novos a quem já era
// cliente, em vez de expirar retroativamente.)
function resolveTrialEnd(user: { trialEndsAt: Date | null; createdAt: Date }): Date {
  if (user.trialEndsAt) return user.trialEndsAt;
  return new Date(user.createdAt.getTime() + TRIAL_DAYS * DAY_MS);
}

// Resolve o estado de acesso da requisição atual. `cache()` garante uma ida
// só ao banco por request, mesmo sendo chamado no layout, no banner e em
// cada página protegida.
export const getAccessState = cache(async (): Promise<AccessState> => {
  const now = new Date();
  const session = await auth();

  const staff: AccessState = {
    hasFullAccess: true,
    kind: "staff",
    endsAt: null,
    daysLeft: 0,
    endingSoon: false,
    plan: undefined,
    planPrice: undefined,
  };

  if (!session?.user?.id) return staff;

  // Admin da plataforma (e, por consequência, o modo suporte que ele ativa)
  // nunca é barrado: quem entra para diagnosticar a conta de um cliente
  // inadimplente precisa justamente conseguir abrir as telas dele.
  if (isAdminEmail(session.user.email)) return staff;
  const ctx = await getEffectiveRestaurantContext();
  if (ctx?.isImpersonating) return staff;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      createdAt: true,
      trialEndsAt: true,
      subscription: {
        select: {
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          caktoOfferId: true,
        },
      },
    },
  });

  if (!user) return staff;

  const subscription = user.subscription;
  const matched = getPlanByOfferId(subscription?.caktoOfferId);
  const plan = matched?.plan;
  const planPrice = matched?.price;

  if (subscription) {
    const paidUntil = subscription.currentPeriodEnd;
    const graceUntil = new Date(paidUntil.getTime() + RENEWAL_GRACE_DAYS * DAY_MS);
    const withinPaidPeriod = now <= graceUntil;

    if (subscription.status === "active" && withinPaidPeriod) {
      const daysLeft = daysUntil(paidUntil, now);
      return {
        hasFullAccess: true,
        kind: "subscribed",
        endsAt: paidUntil,
        daysLeft,
        endingSoon: daysLeft <= SUBSCRIPTION_ENDING_SOON_DAYS,
        plan,
        planPrice,
      };
    }

    // Cancelamento agendado: quem cancelou mas já pagou o mês corrente
    // continua com acesso até o fim do período — é o que foi vendido.
    if (subscription.status === "canceled" && now <= paidUntil) {
      const daysLeft = daysUntil(paidUntil, now);
      return {
        hasFullAccess: true,
        kind: "subscribed",
        endsAt: paidUntil,
        daysLeft,
        endingSoon: true,
        plan,
        planPrice,
      };
    }

    return {
      hasFullAccess: false,
      kind: subscription.status === "canceled" ? "canceled" : "past_due",
      endsAt: null,
      daysLeft: 0,
      endingSoon: false,
      plan,
      planPrice,
    };
  }

  // Sem assinatura: vale o período de teste.
  const trialEnd = resolveTrialEnd(user);
  if (now <= trialEnd) {
    const daysLeft = daysUntil(trialEnd, now);
    return {
      hasFullAccess: true,
      kind: "trial",
      endsAt: trialEnd,
      daysLeft,
      endingSoon: daysLeft <= TRIAL_ENDING_SOON_DAYS,
      plan: undefined,
      planPrice: undefined,
    };
  }

  // Conta que nasceu já sem teste (CPF/CNPJ ou WhatsApp já tinham usado os
  // 15 dias — ver src/app/api/register/route.ts) recebe `trialEndsAt`
  // anterior ao próprio `createdAt`. Esse detalhe é o que diferencia "seu
  // teste acabou" de "este CPF já usou o teste": sem ele, quem nunca teve
  // teste leria uma mensagem sobre um período que não existiu, e ia achar
  // que era bug.
  const neverHadTrial = trialEnd < user.createdAt;

  return {
    hasFullAccess: false,
    kind: neverHadTrial ? "trial_unavailable" : "trial_expired",
    endsAt: null,
    daysLeft: 0,
    endingSoon: false,
    plan: undefined,
    planPrice: undefined,
  };
});
