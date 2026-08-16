import { Skeleton } from "@/components/ui/skeleton";

// Loading instantâneo (convenção `loading.tsx` do Next.js App Router) para
// a rota /dashboard/comanda. Título fixo aparece de imediato — só a lista
// de produtos (que depende da consulta ao banco em `page.tsx`) vira
// esqueleto enquanto carrega.
export default function ComandaLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Comanda</h1>
        <p className="text-muted-foreground">
          Lance o pedido do cliente direto da mesa — vai para a cozinha na hora.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-11 w-full max-w-xs rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl bg-white/[0.02] p-2 ring-1 ring-white/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="size-8 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
