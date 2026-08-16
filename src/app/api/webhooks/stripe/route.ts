import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe";

// Necessário: o corpo precisa chegar cru (sem parsing) para a verificação
// de assinatura do Stripe funcionar.
export async function POST(request: Request) {
  if (!isStripeConfigured || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook do Stripe não configurado." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: `Assinatura inválida: ${message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      if (checkoutSession.mode === "subscription" && checkoutSession.subscription) {
        const subscriptionId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription);
      break;
    }

    default:
      // Eventos não tratados são ignorados intencionalmente.
      break;
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });

  if (!user) {
    console.error(
      `[stripe-webhook] Usuário não encontrado para subscription ${subscription.id} (customer ${customerId}).`
    );
    return;
  }

  const priceId = subscription.items.data[0]?.price.id ?? "";
  const currentPeriodEndSeconds = subscription.items.data[0]?.current_period_end;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodEnd: currentPeriodEndSeconds
        ? new Date(currentPeriodEndSeconds * 1000)
        : new Date(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodEnd: currentPeriodEndSeconds
        ? new Date(currentPeriodEndSeconds * 1000)
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}
