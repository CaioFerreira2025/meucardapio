import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getEffectiveRestaurantContext } from "@/lib/restaurant-context";
import { isAdminEmail } from "@/lib/admin";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OrderNotifications } from "@/components/orders/order-notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const admin = isAdminEmail(session.user.email);
  const ctx = await getEffectiveRestaurantContext();

  if (!ctx) {
    // Administrador da plataforma sem restaurante próprio (o caso normal —
    // ele não é dono de restaurante) e sem "modo suporte" ativo: manda pro
    // Painel Administrativo em vez do onboarding de dono de restaurante.
    if (admin) {
      redirect("/admin");
    }
    redirect("/onboarding");
  }

  return (
    <DashboardShell
      user={session.user}
      restaurantSlug={ctx.restaurant.slug}
      isAdmin={admin}
      isImpersonating={ctx.isImpersonating}
      impersonatedRestaurantName={ctx.isImpersonating ? ctx.restaurant.name : undefined}
    >
      <OrderNotifications />
      {children}
    </DashboardShell>
  );
}
