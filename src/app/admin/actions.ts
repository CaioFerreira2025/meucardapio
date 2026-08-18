"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { IMPERSONATION_COOKIE } from "@/lib/restaurant-context";
import { getModule } from "@/modules/registry";

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    throw new Error("Acesso restrito ao administrador.");
  }
  return session;
}

// Entra em "modo suporte": a partir daqui, /dashboard/* mostra e opera o
// restaurante do cliente escolhido (ver getEffectiveRestaurantContext em
// src/lib/restaurant-context.ts) até `stopImpersonation` ser chamado. Não
// mexe no login/sessão do NextAuth — só grava um cookie que é revalidado
// (isAdminEmail) a cada leitura, então mesmo que alguém plante o cookie na
// mão sem ser admin, ele é ignorado.
export async function startImpersonation(restaurantId: string) {
  await requireAdminSession();

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });
  if (!restaurant) {
    throw new Error("Restaurante não encontrado.");
  }

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, restaurant.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Expira sozinho em 4h — evita ficar "logado como cliente" esquecido.
    maxAge: 60 * 60 * 4,
  });

  redirect("/dashboard");
}

export async function stopImpersonation() {
  await requireAdminSession();

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);

  redirect("/admin");
}

// Liga/desliga um módulo sob demanda para um restaurante específico.
//
// Ligar = criar a linha; desligar = apagar. Nada de coluna `active` booleana:
// com o registro sumindo, "quais módulos este cliente tem?" continua sendo a
// pergunta mais simples possível, e não sobra estado morto no banco.
//
// Desligar NÃO apaga nenhum dado que o módulo tenha gerado — só o acesso à
// tela. Se o cliente voltar a contratar, tudo está onde estava.
export async function setRestaurantModule(
  restaurantId: string,
  moduleKey: string,
  enabled: boolean
) {
  const session = await requireAdminSession();

  // Só aceita chaves que existem no registro do código: sem isso, um clique
  // com o parâmetro adulterado gravaria lixo na tabela.
  if (!getModule(moduleKey)) {
    throw new Error(`Módulo desconhecido: ${moduleKey}`);
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });
  if (!restaurant) {
    throw new Error("Restaurante não encontrado.");
  }

  if (enabled) {
    await prisma.restaurantModule.upsert({
      where: { restaurantId_moduleKey: { restaurantId, moduleKey } },
      create: {
        restaurantId,
        moduleKey,
        enabledByEmail: session.user?.email ?? null,
      },
      // Já ligado: mantém a data original em vez de reiniciar o histórico.
      update: {},
    });
  } else {
    await prisma.restaurantModule.deleteMany({ where: { restaurantId, moduleKey } });
  }

  revalidatePath("/admin");
  // O menu do cliente é montado no layout do painel — precisa revalidar para
  // o item aparecer/sumir sem ele ter que deslogar.
  revalidatePath("/dashboard", "layout");
}
