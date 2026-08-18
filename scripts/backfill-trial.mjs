// Backfill único do período de teste.
//
// Rode UMA VEZ logo depois de aplicar o schema novo (`prisma db push`), antes
// de anunciar a mudança aos clientes.
//
// Por que existe: a coluna `users.trialEndsAt` nasce vazia para todas as
// contas que já existiam. Sem este script, a regra de leitura cai no
// fallback "createdAt + 15 dias" (ver resolveTrialEnd em src/lib/access.ts)
// — o que, para uma conta criada há mais de 15 dias, significa teste JÁ
// VENCIDO e painel bloqueado no primeiro acesso depois do deploy. Este
// script dá 15 dias novos, contados de hoje, a quem já era cliente, para
// ninguém ser surpreendido por um paywall de um recurso que acabou de nascer.
//
// É seguro rodar de novo: só toca em quem está com o campo vazio (`null`),
// nunca sobrescreve uma data já definida, e não altera nenhum outro campo.
//
//   node scripts/backfill-trial.mjs
//
// Para conceder outro prazo, passe os dias como argumento:
//
//   node scripts/backfill-trial.mjs 30

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

const days = Number(process.argv[2] ?? 15);
if (!Number.isFinite(days) || days <= 0) {
  console.error(`Número de dias inválido: ${process.argv[2]}`);
  process.exit(1);
}

const trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const pending = await prisma.user.count({ where: { trialEndsAt: null } });

if (pending === 0) {
  console.log("Nenhuma conta sem data de teste. Nada a fazer.");
} else {
  const result = await prisma.user.updateMany({
    where: { trialEndsAt: null },
    data: { trialEndsAt },
  });
  console.log(
    `${result.count} conta(s) receberam ${days} dias de teste, até ${trialEndsAt.toLocaleDateString("pt-BR")}.`
  );
}

await prisma.$disconnect();
