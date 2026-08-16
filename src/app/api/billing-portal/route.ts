import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getAppUrl } from "@/lib/site";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
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

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "Você ainda não possui uma assinatura." },
      { status: 400 }
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${getAppUrl()}/dashboard/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
