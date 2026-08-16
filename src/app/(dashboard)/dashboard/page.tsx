import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, ExternalLink, UtensilsCrossed, Wallet } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRestaurantByOwnerId } from "@/lib/restaurant";
import { formatCents } from "@/lib/currency";
import { getAppUrl } from "@/lib/site";
import { pageTitle } from "@/config/brand";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { QrCodeCard } from "@/components/dashboard/qr-code-card";

export const metadata: Metadata = {
  title: pageTitle("Dashboard"),
};

export default async function DashboardPage() {
  const session = await auth();
  // O layout do dashboard já garante que o restaurante existe.
  const restaurant = await getRestaurantByOwnerId(session!.user!.id);
  const restaurantId = restaurant!.id;

  const [pendingOrders, todayOrders, productCount] = await Promise.all([
    prisma.order.count({
      where: { restaurantId, status: { in: ["pending", "preparing"] } },
    }),
    prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      select: { totalCents: true },
    }),
    prisma.product.count({
      where: { category: { restaurantId } },
    }),
  ]);

  const todayTotalCents = todayOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const publicMenuUrl = `${getAppUrl()}/r/${restaurant!.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Olá, {session?.user?.name?.split(" ")[0] ?? "por aqui"}
          </h1>
          <p className="text-muted-foreground">
            Painel do <strong className="text-foreground">{restaurant!.name}</strong>.
          </p>
        </div>
        <Button
          className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-600/20 hover:from-orange-400 hover:to-rose-400"
          render={
            <Link href={`/r/${restaurant!.slug}`} target="_blank">
              Ver cardápio público
              <ExternalLink />
            </Link>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pedidos em aberto"
          value={String(pendingOrders)}
          icon={ClipboardList}
          color="orange"
        />
        <StatCard
          label="Faturamento hoje"
          value={formatCents(todayTotalCents)}
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          label="Produtos no cardápio"
          value={String(productCount)}
          icon={UtensilsCrossed}
          color="violet"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link do seu cardápio</CardTitle>
            <CardDescription>
              Compartilhe esse link com seus clientes (redes sociais,
              WhatsApp, QR Code na mesa).
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col gap-3 px-(--card-spacing) sm:flex-row sm:items-center sm:justify-between">
            <code className="min-w-0 truncate rounded-lg bg-black/20 px-3 py-2 text-sm text-orange-200 ring-1 ring-white/10">
              {publicMenuUrl}
            </code>
            <CopyLinkButton url={publicMenuUrl} />
          </div>
        </Card>

        <QrCodeCard url={publicMenuUrl} slug={restaurant!.slug} />
      </div>
    </div>
  );
}
