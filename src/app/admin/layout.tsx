import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { AdminShell } from "@/components/admin/admin-shell";

// Rota restrita ao administrador da plataforma (não confundir com dono de
// restaurante). Não autenticado -> manda pro login como qualquer rota
// protegida. Autenticado mas não-admin -> `notFound()` (404), não um
// "acesso negado": a rota fica invisível pra qualquer usuário final, sem
// nem revelar que ela existe.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!isAdminEmail(session.user.email)) {
    notFound();
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
