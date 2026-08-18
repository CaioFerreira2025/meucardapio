import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { TRIAL_DAYS } from "@/lib/access";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma conta com este email" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Toda conta nova nasce com 15 dias de teste gratuito e acesso completo
  // (equivalente ao Pro). A data é gravada agora, no cadastro, em vez de ser
  // calculada na leitura a partir de `createdAt`: assim dá para esticar o
  // teste de um cliente específico depois (suporte, negociação) mexendo num
  // campo só, sem gambiarra.
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, trialEndsAt },
    select: { id: true, name: true, email: true, trialEndsAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
