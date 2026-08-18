"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { setRestaurantModule } from "@/app/admin/actions";

export type ModuleOption = {
  key: string;
  name: string;
  description: string;
};

// Controle de módulos sob demanda de um restaurante, no Painel
// Administrativo. Uma linha por módulo do registro, com o interruptor
// refletindo o que está gravado no banco.
export function RestaurantModules({
  restaurantId,
  restaurantName,
  modules,
  enabledKeys,
}: {
  restaurantId: string;
  restaurantName: string;
  modules: ModuleOption[];
  enabledKeys: string[];
}) {
  const [isPending, startTransition] = useTransition();

  function toggle(moduleKey: string, moduleName: string, enabled: boolean) {
    startTransition(async () => {
      try {
        await setRestaurantModule(restaurantId, moduleKey, enabled);
        toast.success(
          enabled
            ? `"${moduleName}" liberado para ${restaurantName}.`
            : `"${moduleName}" desativado para ${restaurantName}.`
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Não foi possível salvar."
        );
      }
    });
  }

  if (modules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum módulo cadastrado no registro (src/modules/registry.ts).
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {modules.map((module) => {
        const enabled = enabledKeys.includes(module.key);
        return (
          <div
            key={module.key}
            className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] px-3.5 py-3 ring-1 ring-white/5"
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <Sparkles
                className={
                  enabled
                    ? "mt-0.5 size-4 shrink-0 text-brand-300"
                    : "mt-0.5 size-4 shrink-0 text-muted-foreground"
                }
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{module.name}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {module.description}
                </p>
              </div>
            </div>
            <Switch
              checked={enabled}
              disabled={isPending}
              aria-label={`${enabled ? "Desativar" : "Ativar"} ${module.name} para ${restaurantName}`}
              onCheckedChange={(checked) => toggle(module.key, module.name, checked)}
            />
          </div>
        );
      })}
    </div>
  );
}
