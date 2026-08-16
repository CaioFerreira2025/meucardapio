import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Mesmo padrão de loading.tsx instantâneo das outras rotas do painel (ver
// src/app/(dashboard)/dashboard/menu/loading.tsx) — título e descrição são
// estáticos, só as estatísticas e a lista (que dependem da consulta em
// page.tsx) viram esqueleto.
export default function ReviewsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Avaliações
        </h1>
        <p className="text-muted-foreground">
          Veja o que seus clientes acharam da experiência.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex-row items-center gap-4 px-4">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </Card>
        <Card className="flex-row items-center gap-4 px-4">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-10" />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
