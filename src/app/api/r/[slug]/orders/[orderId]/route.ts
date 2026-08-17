import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Rota pública (sem auth — igual a /r/[slug]/pedido/[orderId], que já expõe
// os mesmos dados a quem tem o link do pedido) usada pelo ActiveOrderPanel
// pra saber, em tempo quase real, se a "sessão" da mesa (guardada no
// localStorage do cliente, ver menu-client.tsx) ainda está ativa: pedido
// não cancelado e, se já "Entregue", com a conta ainda em aberto (sem forma
// de pagamento registrada). Não expõe nada que a tela de acompanhamento já
// não mostrasse.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; orderId: string }> }
) {
  const { slug, orderId } = await params;

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurant: { slug } },
    select: {
      id: true,
      status: true,
      tableNumber: true,
      billRequested: true,
      paymentMethod: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
