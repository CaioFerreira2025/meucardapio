import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getRestaurantByOwnerId } from "@/lib/restaurant";
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

  const restaurant = await getRestaurantByOwnerId(session.user.id);
  if (!restaurant) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell user={session.user} restaurantSlug={restaurant.slug}>
      <OrderNotifications />
      {children}
    </DashboardShell>
  );
}
