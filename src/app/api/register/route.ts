import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { TRIAL_DAYS } from "@/lib/access";
import { parseDocument, parsePhone } from "@/lib/identity";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: issue?.message ?? "Dados inválidos",
        field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
      },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  // Validação forte de CPF/CNPJ e celular (dígitos verificadores e formato),
  // não só "veio preenchido" — ver src/lib/identity.ts. Sem isso, burlar o
  // teste único seria digitar 11111111111, 11111111112, etc.
  const documentResult = parseDocument(parsed.data.document);
  if (!documentResult.ok) {
    return NextResponse.json({ error: documentResult.error, field: "document" }, { status: 400 });
  }
  const phoneResult = parsePhone(parsed.data.phone);
  if (!phoneResult.ok) {
    return NextResponse.json({ error: phoneResult.error, field: "phone" }, { status: 400 });
  }

  const document = documentResult.digits;
  const phone = phoneResult.digits;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma conta com este email", field: "email" },
      { status: 409 }
    );
  }

  // Documento e telefone são únicos por conta. Mensagem aponta o login em vez
  // de só barrar: quem cai aqui quase sempre é alguém que já tem conta e
  // esqueceu, não um fraudador.
  const duplicate = await prisma.user.findFirst({
    where: { OR: [{ document }, { phone }] },
    select: { document: true },
  });
  if (duplicate) {
    const isSameDocument = duplicate.document === document;
    return NextResponse.json(
      {
        error: isSameDocument
          ? "Já existe uma conta com este CPF/CNPJ. Faça login ou recupere sua senha."
          : "Já existe uma conta com este WhatsApp. Faça login ou recupere sua senha.",
        field: isSameDocument ? "document" : "phone",
      },
      { status: 409 }
    );
  }

  // ===== Teste gratuito único =====
  // Se este CPF/CNPJ ou este telefone JÁ usou o teste alguma vez (mesmo que
  // aquela conta tenha sido excluída — ver TrialClaim no schema), a conta é
  // criada normalmente, porém já sem período de teste: `trialEndsAt` no
  // passado faz getAccessState() devolver acesso bloqueado, e o usuário cai
  // direto na tela de planos.
  const previousClaim = await prisma.trialClaim.findFirst({
    where: { OR: [{ document }, { phone }] },
    select: { id: true },
  });

  const hasUsedTrial = Boolean(previousClaim);
  const trialEndsAt = hasUsedTrial
    ? new Date(Date.now() - DAY_MS) // já vencido: bloqueado desde o primeiro acesso
    : new Date(Date.now() + TRIAL_DAYS * DAY_MS);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, document, phone, trialEndsAt },
    select: { id: true, name: true, email: true, trialEndsAt: true },
  });

  if (!hasUsedTrial) {
    // Registra o consumo do teste. `catch` silencioso de propósito: numa
    // corrida entre dois cadastros simultâneos com o mesmo documento, o
    // segundo esbarra na constraint única — e tudo bem, o registro que
    // importa (o do primeiro) já existe. Falhar aqui cancelaria um cadastro
    // que, de resto, deu certo.
    await prisma.trialClaim
      .create({ data: { document, phone, userId: user.id, userEmail: user.email } })
      .catch(() => undefined);
  }

  return NextResponse.json(
    { user, trial: { granted: !hasUsedTrial, endsAt: user.trialEndsAt } },
    { status: 201 }
  );
}
