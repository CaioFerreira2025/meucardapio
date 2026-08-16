import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Mesmo padrão de loading.tsx instantâneo usado nas outras rotas do
// painel (ver src/app/(dashboard)/dashboard/menu/loading.tsx) — título e
// descrição são estáticos, só o formulário (que depende da consulta ao
// restaurante em page.tsx) vira esqueleto.
export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Edite a identidade do seu restaurante — nome, contato e logo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-20 w-full max-w-xs" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
