import type { Metadata } from "next";
import { MessageCircle, MessageSquareText, Star } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { pageTitle } from "@/config/brand";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { PaywallScreen } from "@/components/billing/paywall-screen";
import { getAccessState } from "@/lib/access";
import { PageHelp } from "@/components/dashboard/page-help";
import { EmptyState } from "@/components/dashboard/empty-state";

export const metadata: Metadata = {
  title: pageTitle("Avaliações"),
};

function StarRow({ rating, size = "size-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            size,
            value <= rating ? "fill-orange-400 text-orange-400" : "fill-transparent text-zinc-600"
          )}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  // Paywall: com o teste expirado (ou pagamento pendente/assinatura
  // encerrada) esta tela dá lugar à escolha de plano. Só "Cobrança" e
  // "Configurações" seguem liberadas — são justamente as telas que o lojista
  // precisa para voltar a ficar em dia.
  const access = await getAccessState();
  if (!access.hasFullAccess) {
    return <PaywallScreen state={access} />;
  }

  const restaurant = await getEffectiveRestaurant();

  const reviews = await prisma.review.findMany({
    where: { restaurantId: restaurant!.id },
    orderBy: { createdAt: "desc" },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

  // Distribuição por nota (5 estrelas primeiro) — mesma lista de reviews já
  // carregada acima, sem consulta extra ao banco.
  const distribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => review.rating === rating).length;
    const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { rating, count, percent };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-1 text-2xl font-semibold tracking-tight text-white">
          Avaliações
          <PageHelp page="reviews" />
        </h1>
        <p className="text-muted-foreground">
          Veja o que seus clientes acharam da experiência.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Nota média"
          value={totalReviews > 0 ? averageRating.toFixed(1).replace(".", ",") : "—"}
          icon={Star}
          color="orange"
        />
        <StatCard
          label="Total de avaliações"
          value={String(totalReviews)}
          icon={MessageSquareText}
          color="violet"
        />
      </div>

      {totalReviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição das notas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {distribution.map(({ rating, count, percent }) => (
              <div key={rating} className="flex items-center gap-3 text-sm">
                <span className="flex w-10 shrink-0 items-center gap-1 text-muted-foreground">
                  {rating} <Star className="size-3.5 fill-orange-400 text-orange-400" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                  {count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {totalReviews === 0 ? (
        <EmptyState
          icon={Star}
          title="As notas chegam sozinhas"
          description="Depois que um pedido é marcado como entregue, o cliente recebe o convite para avaliar no próprio celular. As notas e comentários aparecem aqui — e quem avaliar mal ganha um atalho direto para você responder no WhatsApp."
          action={{ label: "Ver pedidos", href: "/dashboard/orders" }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="flex flex-col gap-2 py-4">
                <div className="flex items-center justify-between gap-3">
                  <StarRow rating={review.rating} />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {review.createdAt.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {(review.name || review.phone) && (
                  <p className="text-sm font-medium text-white">
                    {review.name || "Cliente"}
                    {review.phone && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {review.phone}
                      </span>
                    )}
                  </p>
                )}
                {review.comment && (
                  <p className="text-sm text-foreground">{review.comment}</p>
                )}
                {review.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 w-fit gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                    render={
                      <a
                        href={buildWhatsAppLink(
                          review.phone,
                          `Olá${review.name ? ` ${review.name}` : ""}! Aqui é do ${restaurant!.name}. Vimos sua avaliação e queríamos conversar com você a respeito.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <MessageCircle className="size-3.5" />
                    Responder no WhatsApp
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
