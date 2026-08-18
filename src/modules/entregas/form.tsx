"use client";

import { useRef, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteDeliveryZone, saveDeliveryZone } from "@/modules/actions";

export function DeliveryZonesForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await saveDeliveryZone(formData);
        formRef.current?.reset();
        toast.success("Bairro salvo.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card p-5 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input id="neighborhood" name="neighborhood" placeholder="Centro" required />
      </div>
      <div className="flex flex-col gap-1.5 sm:w-40">
        <Label htmlFor="fee">Taxa de entrega</Label>
        <Input id="fee" name="fee" inputMode="decimal" placeholder="0,00" defaultValue="0,00" />
        <p className="text-xs text-muted-foreground">0,00 = grátis</p>
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-400 hover:to-rose-400"
      >
        <Plus className="size-4" />
        {isPending ? "Salvando..." : "Adicionar"}
      </Button>
    </form>
  );
}

// Export NOMEADO, e não uma propriedade de `DeliveryZonesForm`.
//
// A versão anterior pendurava este componente no form
// (`DeliveryZonesForm.DeleteButton = ...`) para a tela do módulo importar um
// arquivo só. Isso quebra: quando um Server Component importa um módulo
// "use client", ele não recebe a função de verdade — recebe uma referência
// que o bundler resolve no navegador. Propriedades penduradas nessa função
// não existem nessa referência, então `DeliveryZonesForm.DeleteButton` chega
// como `undefined` e o React derruba a tela inteira com "Element type is
// invalid" no primeiro bairro cadastrado (sem bairro nenhum a tela abre
// normalmente, porque o botão nem chega a ser renderizado).
export function DeleteZoneButton({
  zoneId,
  name,
}: {
  zoneId: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Remover ${name}`}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteDeliveryZone(zoneId);
            toast.success(`"${name}" removido.`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível remover.");
          }
        })
      }
    >
      <Trash2 />
    </Button>
  );
}
