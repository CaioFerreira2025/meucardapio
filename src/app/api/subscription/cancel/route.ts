import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { caktoFetch, isCaktoConfigured } from "@/lib/cakto";

// Substitui o antigo /api/billing-portal (Stripe Billing Portal). A Cakto
// não tem um portal de autoatendimento hospedado equivalente (onde o
// cliente troca cartão, vê faturas etc.) — o que a API dela oferece é
// cancelar a assinatura diretamente, então é isso que expomos aqui, a
// pedido explícito do usuário (ver CancelSubscriptionButton, com
// confirmação antes de chamar essa rota).
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!isCaktoConfigured) {
    return NextResponse.json(
      {
        error:
          "Cakto não está configurada neste ambiente. Defina CAKTO_CLIENT_ID e CAKTO_CLIENT_SECRET no .env.",
      },
      { status: 500 }
    );
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  if (!subscription?.caktoSubscriptionId) {
    return NextResponse.json(
      { error: "Você ainda não possui uma assinatura ativa na Cakto." },
      { status: 400 }
    );
  }

  const response = await caktoFetch(
    `/subscriptions/${subscription.caktoSubscriptionId}/cancel/`,
    { method: "POST" }
  );

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    console.error(
      `[cakto] Falha ao cancelar assinatura ${subscription.caktoSubscriptionId}: ${response.status} ${message}`
    );
    return NextResponse.json(
      { error: "Não foi possível cancelar a assinatura agora. Tente novamente." },
      { status: 502 }
    );
  }

  // Atualiza localmente na hora — não esperamos o webhook `subscription_canceled`
  // pra refletir na tela, embora ele também deva chegar e reafirmar o mesmo
  // estado (a atualização é idempotente).
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "canceled", cancelAtPeriodEnd: false },
  });

  return NextResponse.json({ success: true });
}
