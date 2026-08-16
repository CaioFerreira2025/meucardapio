import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Loading instantâneo (convenção `loading.tsx` do Next.js App Router) para
// a rota /dashboard/caixa. Título fixo aparece de imediato — só os cards
// que dependem da consulta ao banco em `page.tsx` viram esqueleto.
export default function CaixaLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Caixa</h1>
        <p className="text-muted-foreground">
          Controle o faturamento do dia e feche o turno com o saldo da
          gaveta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex-row items-center gap-4 px-4">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1.5 h-3 w-64" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Skeleton className="h-9 w-full sm:max-w-xs" />
          <Skeleton className="h-9 w-32 shrink-0 rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
