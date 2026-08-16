import { CreditCard } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

// Loading instantâneo (convenção `loading.tsx` do Next.js App Router) para
// a rota /dashboard/billing. Título e descrição já aparecem de imediato —
// só o card com o status da assinatura (que depende da consulta ao banco
// em `page.tsx`) vira esqueleto enquanto carrega. Puramente visual: nenhuma
// consulta, rota ou lógica de negócio é alterada.
export default function BillingLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Cobrança
        </h1>
        <p className="text-muted-foreground">
          Veja o status da sua assinatura e gerencie o método de pagamento.
        </p>
      </div>

      <Card className="max-w-lg overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400/20 to-rose-500/20 ring-1 ring-orange-500/20">
                <CreditCard className="size-4 text-orange-300/60" />
              </span>
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-3.5 w-3/4" />
          <Skeleton className="mt-3 h-8 w-24" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="size-4 shrink-0 rounded-full" />
                <Skeleton className="h-3.5 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </CardFooter>
      </Card>
    </div>
  );
}
