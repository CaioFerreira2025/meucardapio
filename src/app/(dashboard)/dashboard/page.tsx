import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList,
  ExternalLink,
  Flame,
  ImageIcon,
  PlusCircle,
  Receipt,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { getTablesAwaitingBill } from "@/lib/tables";
import { formatCents } from "@/lib/currency";
import { getAppUrl } from "@/lib/site";
import { pageTitle } from "@/config/brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { QrCodeCard } from "@/components/dashboard/qr-code-card";
import { BillRequestsAlert } from "@/components/tables/bill-requests-alert";

export const metadata: Metadata = {
  title: pageTitle("Dashboard"),
};

export default async function DashboardPage() {
  const session = await auth();
  // O layout do dashboard já garante que o restaurante existe (o próprio
  // ou, em modo suporte, o do cliente impersonado).
  const restaurant = await getEffectiveRestaurant();
  const restaurantId = restaurant!.id;

  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  const [
    pendingOrders,
    todayOrders,
    productCount,
    validOrders,
    todayItems,
    tablesAwaitingBill,
  ] = await Promise.all([
      prisma.order.count({
        where: { restaurantId, status: { in: ["pending", "preparing"] } },
      }),
      prisma.order.findMany({
        where: {
          restaurantId,
          createdAt: { gte: startOfToday },
          // Pedido cancelado nunca vira receita de verdade — exclui do
          // faturamento do dia (o valor total do card já não deve nem contar
          // esses pedidos, mesmo que tenham sido criados hoje).
          status: { not: "cancelled" },
        },
        select: { totalCents: true },
      }),
      prisma.product.count({
        where: { category: { restaurantId } },
      }),
      // Base para o Ticket médio: todos os pedidos válidos (não cancelados)
      // já cadastrados, mesma regra de "cancelado não conta" usada acima e
      // na página de Clientes.
      prisma.order.findMany({
        where: { restaurantId, status: { not: "cancelled" } },
        select: { totalCents: true },
      }),
      // Base para o "Mais vendido hoje": itens dos pedidos de hoje (não
      // cancelados), com a imagem atual do produto para exibir no card.
      prisma.orderItem.findMany({
        where: {
          order: {
            restaurantId,
            createdAt: { gte: startOfToday },
            status: { not: "cancelled" },
          },
        },
        select: {
          productId: true,
          productName: true,
          quantity: true,
          unitPriceCents: true,
          product: { select: { imageUrl: true } },
        },
      }),
      getTablesAwaitingBill(restaurantId),
    ]);

  const todayTotalCents = todayOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const publicMenuUrl = `${getAppUrl()}/r/${restaurant!.slug}`;

  // Ticket médio = faturamento válido total / número de pedidos válidos.
  const validOrdersTotalCents = validOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const averageTicketCents =
    validOrders.length > 0 ? Math.round(validOrdersTotalCents / validOrders.length) : 0;

  // Agrega os itens de hoje por produto para achar o mais vendido (por
  // quantidade — não por faturamento, para não distorcer com um item caro
  // vendido uma única vez).
  const salesByProduct = new Map<
    string,
    { name: string; quantity: number; revenueCents: number; imageUrl: string | null }
  >();
  for (const item of todayItems) {
    const existing = salesByProduct.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
      existing.revenueCents += item.unitPriceCents * item.quantity;
    } else {
      salesByProduct.set(item.productId, {
        name: item.productName,
        quantity: item.quantity,
        revenueCents: item.unitPriceCents * item.quantity,
        imageUrl: item.product?.imageUrl ?? null,
      });
    }
  }
  const topProduct =
    Array.from(salesByProduct.values()).sort((a, b) => b.quantity - a.quantity)[0] ?? null;

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

      <BillRequestsAlert tables={tablesAwaitingBill} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          label="Ticket médio"
          value={formatCents(averageTicketCents)}
          icon={Receipt}
          color="violet"
        />
        <StatCard
          label="Produtos no cardápio"
          value={String(productCount)}
          icon={UtensilsCrossed}
          color="orange"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="size-4 text-orange-400" />
              Mais vendido hoje
            </CardTitle>
            <CardDescription>
              {topProduct
                ? "O prato que mais saiu no cardápio hoje."
                : "Assim que os primeiros pedidos de hoje chegarem, o prato mais vendido aparece aqui."}
            </CardDescription>
          </CardHeader>
          {topProduct && (
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-white/5">
                  {topProduct.imageUrl ? (
                    <Image
                      src={topProduct.imageUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                      // Upload de produto vira uma data: URL (ver
                      // src/lib/uploads.ts) — o otimizador do Next não
                      // processa isso, então pulamos a otimização nesse caso,
                      // igual já é feito em ProductRow.
                      unoptimized={topProduct.imageUrl.startsWith("data:")}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ImageIcon className="size-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{topProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {topProduct.quantity}{" "}
                    {topProduct.quantity === 1 ? "unidade vendida" : "unidades vendidas"} ·{" "}
                    {formatCents(topProduct.revenueCents)}
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações rápidas</CardTitle>
            <CardDescription>Atalhos para o que você mais usa no dia a dia.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-600/20 hover:from-orange-400 hover:to-rose-400 sm:w-auto"
              render={
                <Link href="/dashboard/menu">
                  <PlusCircle className="size-4" />
                  Novo produto
                </Link>
              }
            />
            <Button
              variant="outline"
              className="w-full gap-2 rounded-xl sm:w-auto"
              render={
                <Link href="/dashboard/orders">
                  <ClipboardList className="size-4" />
                  Ver pedidos
                </Link>
              }
            />
          </CardContent>
        </Card>
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

        <QrCodeCard
          url={publicMenuUrl}
          slug={restaurant!.slug}
          logoUrl={restaurant!.logoUrl}
          restaurantName={restaurant!.name}
        />
      </div>
    </div>
  );
}
