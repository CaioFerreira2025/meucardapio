"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { deleteCoupon, saveCoupon, setCouponActive } from "@/modules/actions";

export function CouponForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await saveCoupon(formData);
        formRef.current?.reset();
        setDiscountType("percent");
        toast.success("Cupom salvo.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-5"
    >
      <input type="hidden" name="discountType" value={discountType} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Código do cupom</Label>
          <Input
            id="code"
            name="code"
            placeholder="PRIMEIRACOMPRA"
            required
            className="font-mono tracking-wider uppercase"
          />
          <p className="text-xs text-muted-foreground">
            O cliente pode digitar em minúsculas — a comparação ignora isso.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Tipo de desconto</Label>
          <div className="flex gap-1.5">
            {(
              [
                { key: "percent", label: "Percentual (%)" },
                { key: "fixed", label: "Valor fixo (R$)" },
              ] as const
            ).map((option) => (
              <Button
                key={option.key}
                type="button"
                size="sm"
                variant={discountType === option.key ? "default" : "outline"}
                className={cn(
                  discountType === option.key &&
                    "bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-400 hover:to-brand-300"
                )}
                onClick={() => setDiscountType(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="discountValue">
            {discountType === "percent" ? "Desconto (%)" : "Desconto (R$)"}
          </Label>
          <Input
            id="discountValue"
            name="discountValue"
            inputMode="decimal"
            placeholder={discountType === "percent" ? "10" : "15,00"}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="minOrder">Pedido mínimo</Label>
          <Input id="minOrder" name="minOrder" inputMode="decimal" placeholder="0,00" />
          <p className="text-xs text-muted-foreground">0,00 = sem mínimo</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maxUses">Limite de usos</Label>
          <Input id="maxUses" name="maxUses" inputMode="numeric" placeholder="Ilimitado" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expiresAt">Vence em</Label>
          <Input id="expiresAt" name="expiresAt" type="date" />
        </div>
      </div>

      <div>
        <Button
          type="submit"
          disabled={isPending}
          className="gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-400 hover:to-brand-300"
        >
          <Plus className="size-4" />
          {isPending ? "Salvando..." : "Criar cupom"}
        </Button>
      </div>
    </form>
  );
}

export function CouponRowActions({
  couponId,
  code,
  isActive,
}: {
  couponId: string;
  code: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Switch
          checked={isActive}
          disabled={isPending}
          aria-label={`${isActive ? "Pausar" : "Reativar"} o cupom ${code}`}
          onCheckedChange={(checked) =>
            startTransition(async () => {
              try {
                await setCouponActive(couponId, checked);
                toast.success(checked ? `"${code}" reativado.` : `"${code}" pausado.`);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Erro ao salvar.");
              }
            })
          }
        />
        <span className="text-xs text-muted-foreground">{isActive ? "Ativo" : "Pausado"}</span>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Excluir o cupom ${code}`}
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await deleteCoupon(couponId);
              toast.success(`"${code}" excluído.`);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Erro ao excluir.");
            }
          })
        }
      >
        <Trash2 />
      </Button>
    </div>
  );
}
