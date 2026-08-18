import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

// Loading instantâneo (convenção `loading.tsx` do Next.js App Router) para
// a rota /dashboard/orders. Título e as 4 colunas do quadro (Recebidos, Em
// preparo, Prontos, Entregues) já aparecem de imediato — só os cards de
// pedido dentro de cada coluna (que dependem da consulta ao banco em
// `page.tsx`) viram esqueleto enquanto carregam. Puramente visual: nenhuma
// consulta, rota ou lógica de negócio é alterada.
const COLUMNS = [
  { title: "Recebidos", dotClassName: "bg-zinc-400", cards: 1 },
  { title: "Em preparo", dotClassName: "bg-brand-400/60", cards: 1 },
  { title: "Prontos", dotClassName: "bg-emerald-400/60", cards: 0 },
  { title: "Entregues", dotClassName: "bg-zinc-600", cards: 1 },
];

function OrderCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-1.5 h-3 w-1/2" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="mt-2 flex justify-between border-t border-border pt-2">
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2">
        <Skeleton className="h-7 w-full rounded-lg" />
        <Skeleton className="h-7 w-full rounded-lg" />
      </CardFooter>
    </Card>
  );
}

export default function OrdersLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Central de pedidos
        </h1>
        <p className="text-muted-foreground">
          Acompanhe cada pedido do recebimento até a entrega.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {COLUMNS.map((column) => (
          <section key={column.title} className="flex min-w-0 flex-col gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className={`size-2 shrink-0 rounded-full ${column.dotClassName}`} />
              {column.title}
            </h2>
            <div className="flex flex-col gap-3">
              {column.cards === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-6" />
              ) : (
                Array.from({ length: column.cards }).map((_, i) => (
                  <OrderCardSkeleton key={i} />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
