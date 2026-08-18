import { UtensilsCrossed } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DarkPortalRoot } from "@/components/theme/dark-portal-root";

// Loading instantâneo (convenção `loading.tsx` do Next.js App Router) para
// o cardápio público — é exatamente o que faz o cardápio parar de mostrar
// uma aba em branco enquanto a consulta ao banco roda: o Next já manda
// esse esqueleto pro celular do cliente na hora, sem esperar a página
// terminar de buscar restaurante/categorias/produtos. Mesmo fundo escuro,
// mesmo container (max-w-3xl) e mesmo formato de card do cardápio real
// (page.tsx / menu-client.tsx) para não ter nenhum salto de layout quando
// o conteúdo de verdade chega — puramente visual, nenhuma consulta, rota
// ou lógica de negócio muda.
export default function PublicMenuLoading() {
  return (
    // Mesmo ajuste de min-h-dvh + overflow-x-hidden do page.tsx real (ver
    // comentário lá) — o esqueleto de loading precisa ter exatamente o
    // mesmo comportamento de altura, senão a página "pula" de tamanho
    // assim que o conteúdo de verdade chega.
    <DarkPortalRoot className="dark relative min-h-dvh w-full overflow-x-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-[-15%] left-1/4 h-[28rem] w-[28rem] rounded-full bg-brand-600/10 blur-[130px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-96 w-96 rounded-full bg-rose-600/[0.07] blur-[120px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pb-28 sm:px-6">
        <header className="flex flex-col items-center gap-3 pt-10 pb-6 text-center sm:pt-14">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-xl shadow-brand-800/30 ring-1 ring-white/10">
            <UtensilsCrossed className="size-7 text-white" strokeWidth={2} />
          </span>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="mt-1 h-6 w-32 rounded-full" />
        </header>

        {Array.from({ length: 2 }).map((_, categoryIndex) => (
          <section key={categoryIndex} className="flex flex-col gap-3">
            <Skeleton className="h-5 w-32" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, productIndex) => (
                <Card key={productIndex} className="gap-0 overflow-hidden py-0">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <CardHeader className="gap-2 pt-4 pb-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pt-2 pb-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DarkPortalRoot>
  );
}
