import { TicketPercent } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { ModulePageProps } from "@/modules/registry";
import { CouponForm, CouponRowActions } from "@/modules/cupons/form";
import { formatCents } from "@/lib/currency";

// MÓDULO: Cupons (chave "cupons")
//
// A validação do cupom vive em src/modules/shared.ts (applyCoupon) porque
// roda em dois lugares: no carrinho, para mostrar o desconto, e de novo na
// criação do pedido, para recalcular. Confiar no valor vindo da tela deixaria
// qualquer um forjar um desconto adulterando a requisição.
export default async function CuponsModule({ restaurantId }: ModulePageProps) {
  const coupons = await prisma.coupon.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <CouponForm />

      {coupons.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title="Nenhum cupom criado ainda"
          description="Cupons são uma forma rápida de movimentar as vendas: um código de primeira compra, uma promoção de terça-feira parada, ou um desconto para quem sumiu. O cliente digita o código no carrinho e o desconto entra na hora."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {coupons.map((coupon) => {
            const esgotado =
              coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
            const vencido = coupon.expiresAt ? new Date() > coupon.expiresAt : false;
            const indisponivel = !coupon.isActive || esgotado || vencido;

            return (
              <div
                key={coupon.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-card p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded-lg bg-white/[0.06] px-2.5 py-1 font-mono text-sm font-semibold tracking-wider text-orange-200">
                      {coupon.code}
                    </code>
                    <span className="text-sm font-medium text-white">
                      {coupon.discountType === "percent"
                        ? `${coupon.discountValue}% OFF`
                        : `${formatCents(coupon.discountValue)} OFF`}
                    </span>
                    {indisponivel && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
                        {vencido ? "Vencido" : esgotado ? "Esgotado" : "Pausado"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {coupon.minOrderCents > 0
                      ? `Pedido mínimo ${formatCents(coupon.minOrderCents)} · `
                      : ""}
                    Usado {coupon.usedCount}
                    {coupon.maxUses !== null ? ` de ${coupon.maxUses}` : " vez(es)"}
                    {coupon.expiresAt
                      ? ` · Vence em ${coupon.expiresAt.toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                </div>

                <CouponRowActions
                  couponId={coupon.id}
                  code={coupon.code}
                  isActive={coupon.isActive}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
