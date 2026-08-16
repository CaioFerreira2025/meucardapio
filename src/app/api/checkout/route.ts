import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getCaktoCheckoutUrl } from "@/lib/cakto";
import { PLANS } from "@/config/plans";

const bodySchema = z.object({
  planId: z.enum(["starter", "pro"]),
});

// Diferente do checkout do Stripe (que criava uma sessão via API antes de
// redirecionar), o checkout da Cakto é uma página hospedada com URL fixa
// por oferta — não precisamos chamar a API deles aqui (nem de
// CAKTO_CLIENT_ID/SECRET, usados só para chamadas autenticadas como
// cancelar assinatura — ver src/lib/cakto.ts), só montar a URL com o
// e-mail/nome do usuário pré-preenchidos. Mantemos essa rota (em vez de
// montar a URL direto no client) para não precisar mexer no
// CheckoutButton.tsx, que já espera um POST retornando `{ url }`.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const plan = PLANS.find((item) => item.id === parsed.data.planId);
  if (!plan?.caktoOfferId) {
    return NextResponse.json(
      {
        error: `Oferta da Cakto para o plano "${parsed.data.planId}" não configurada (ver CAKTO_OFFER_ID_* no .env).`,
      },
      { status: 500 }
    );
  }

  const url = getCaktoCheckoutUrl(plan.caktoOfferId, {
    email: session.user.email,
    name: session.user.name,
  });

  return NextResponse.json({ url });
}
