import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Loading instantâneo (convenção `loading.tsx` do Next.js App Router) para
// a rota /dashboard/menu. O título e a descrição são estáticos (não vêm do
// banco), então aparecem de imediato — só a lista de categorias/produtos
// (que depende da consulta ao banco em `page.tsx`) vira esqueleto enquanto
// carrega. Puramente visual: nenhuma consulta, rota ou lógica de negócio é
// alterada, só o que já existia em `page.tsx` continua exatamente igual.
export default function MenuLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Cardápio
          </h1>
          <p className="text-muted-foreground">
            Organize categorias e produtos do seu cardápio digital.
          </p>
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="size-1.5 shrink-0 rounded-full bg-gradient-to-br from-brand-400/50 to-brand-500/50" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col py-2">
              {Array.from({ length: 3 }).map((_, productIndex) => (
                <div
                  key={productIndex}
                  className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Skeleton className="size-14 shrink-0 rounded-lg" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Skeleton className="h-3.5 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-14 shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
