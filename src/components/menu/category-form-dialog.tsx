"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, type FormState } from "@/app/(dashboard)/dashboard/menu/actions";

const initialState: FormState = {};

export function CategoryFormDialog({
  // Rótulo/estilo alternativos para quando o botão é a ação principal de um
  // estado vazio ("Criar primeira categoria", em destaque) em vez do botão
  // secundário do topo da página ("Nova categoria").
  triggerLabel,
}: {
  triggerLabel?: string;
} = {}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createCategory,
    initialState
  );

  // Fecha o dialog quando o submit terminar sem erros. Atualizar estado
  // durante a renderização (em vez de num useEffect) é o padrão
  // recomendado pelo React para "reagir" a uma mudança de props/estado.
  const [prevPending, setPrevPending] = useState(isPending);
  if (isPending !== prevPending) {
    setPrevPending(isPending);
    if (!isPending && !state.error && !state.fieldErrors) {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          triggerLabel ? (
            <Button className="gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-800/20 hover:from-brand-400 hover:to-brand-300">
              <Plus />
              {triggerLabel}
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Plus />
              Nova categoria
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
          <DialogDescription>
            Ex.: Lanches, Bebidas, Sobremesas.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category-name">Nome</Label>
            <Input id="category-name" name="name" placeholder="Lanches" required />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
