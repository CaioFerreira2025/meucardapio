"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { IMPERSONATION_COOKIE } from "@/lib/restaurant-context";

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
