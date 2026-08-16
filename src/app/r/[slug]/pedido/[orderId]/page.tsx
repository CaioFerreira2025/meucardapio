import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/currency";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, isOrderStatus } from "@/lib/order-status";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { RequestBillButton } from "@/components/orders/request-bill-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DarkPortalRoot } from "@/components/theme/dark-portal-root";
import { pageTitle } from "@/config/brand";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: pageTitle("Acompanhar pedido"),
};

// Passos "felizes" do pedido, usados para desenhar a barra de progresso.
// Pedidos cancelados não entram nessa linha do tempo — eles só mostram o
// badge de status.
const HAPPY_PATH = ORDER_STATUSES.filter((s) => s !== "cancelled");

export default async function OrderTrackingPage(
  props: PageProps<"/r/[slug]/pedido/[orderId]">
) {
  const { slug, orderId } = await props.params;

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurant: { slug } },
    include: { items: true, restaurant: true },
  });

  if (!order) {
    notFound();
  }

  const statusLabel = isOrderStatus(order.status)
    ? ORDER_STATUS_LABEL[order.status]
    : order.status;
  const isCancelled = order.status === "cancelled";
  // "Pedir a conta" fica visível do momento em que o pedido é feito até
  // "Entregue" (completed) — só some se o pedido foi cancelado. Antes
  // faltava "completed" nessa lista, então o botão sumia assim que o
  // pedido era marcado como entregue.
  const canRequestBill = (
    ["pending", "preparing", "ready", "completed"] as string[]
  ).includes(order.status);
  const currentStepIndex = (
    HAPPY_PATH as readonly string[]
  ).indexOf(isOrderStatus(order.status) ? order.status : "pending");

  return (
    // Mesmo ajuste de min-h-dvh + overflow-x-hidden do cardápio público
    // (ver comentário em src/app/r/[slug]/page.tsx) — esta também é uma
    // tela do cliente, acessada logo depois do checkout ou pelo atalho
    // "Conta" do menu inferior.
    <DarkPortalRoot className="dark relative min-h-dvh w-full overflow-x-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-[-15%] left-1/3 h-[28rem] w-[28rem] rounded-full bg-orange-600/10 blur-[130px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-96 w-96 rounded-full bg-rose-600/[0.07] blur-[120px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10 sm:py-14">
        <Link
          href={`/r/${slug}`}
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar ao cardápio
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-white">
              <span className="min-w-0 truncate">
                Pedido em {order.restaurant.name}
              </span>
              <OrderStatusBadge status={order.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!isCancelled && (
              <div className="flex items-center">
                {HAPPY_PATH.map((step, index) => {
                  const isDone = index <= currentStepIndex;
                  const isLast = index === HAPPY_PATH.length - 1;
                  return (
                    <div
                      key={step}
                      className={cn("flex items-center", !isLast && "flex-1")}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full ring-1 transition-colors",
                            isDone
                              ? "bg-gradient-to-br from-orange-500 to-rose-500 text-white ring-orange-500/30"
                              : "bg-white/5 text-muted-foreground ring-white/10"
                          )}
                        >
                          {isDone ? (
                            <Check className="size-3.5" strokeWidth={3} />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "hidden text-center text-[11px] leading-tight sm:block",
                            isDone ? "text-white" : "text-muted-foreground"
                          )}
                        >
                          {ORDER_STATUS_LABEL[step]}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className={cn(
                            "mx-1.5 h-0.5 flex-1 rounded-full transition-colors",
                            index < currentStepIndex ? "bg-orange-500" : "bg-white/10"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Status atual:{" "}
              <span className="font-medium text-white">{statusLabel}</span>
            </p>

            <div className="flex flex-col gap-1 border-t border-border pt-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCents(item.unitPriceCents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t border-border pt-4 text-sm font-medium">
              <span className="text-muted-foreground">Total</span>
              <span className="text-lg font-semibold text-orange-300">
                {formatCents(order.totalCents)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <RequestBillButton
                orderId={order.id}
                initialRequested={order.billRequested}
                canRequest={canRequestBill}
              />
              <Button
                variant="outline"
                render={<Link href={`/r/${slug}`}>Fazer novo pedido</Link>}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DarkPortalRoot>
  );
}
