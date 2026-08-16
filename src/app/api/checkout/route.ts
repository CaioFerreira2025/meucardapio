import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getAppUrl } from "@/lib/site";
import { PLANS } from "@/config/plans";

const bodySchema = z.object({
  planId: z.enum(["starter", "pro"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!isStripeConfigured) {
    return NextResponse.json(
      {
        error:
          "Stripe não está configurado neste ambiente. Defina STRIPE_SECRET_KEY no .env.",
      },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const plan = PLANS.find((item) => item.id === parsed.data.planId);
  if (!plan?.priceId) {
    return NextResponse.json(
      {
        error: `Price ID do plano "${parsed.data.planId}" não configurado (ver STRIPE_PRICE_ID_* no .env).`,
      },
      { status: 500 }
    );
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  // Reaproveita o customer do Stripe se o usuário já tiver um; cria um novo
  // caso contrário e persiste para as próximas cobranças/portal.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = getAppUrl();

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    client_reference_id: user.id,
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  if (!checkoutSession.url) {
    return NextResponse.json(
      { error: "Não foi possível criar a sessão de checkout." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: checkoutSession.url });
}
