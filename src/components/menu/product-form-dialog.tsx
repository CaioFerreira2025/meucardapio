"use client";

import { useActionState, useMemo, useState } from "react";
import { Pencil, Plus, Sparkles } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductImageUpload } from "@/components/menu/product-image-upload";
import { formatCents, parseCentsFromInput } from "@/lib/currency";
import {
  createProduct,
  updateProduct,
  type FormState,
} from "@/app/(dashboard)/dashboard/menu/actions";

const initialState: FormState = {};

type CategoryOption = { id: string; name: string };
type ProductOption = { id: string; name: string; categoryName: string };

type ExistingProduct = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  costCents: number | null;
  isAvailable: boolean;
  imageUrl: string | null;
  complements: { id: string }[];
};

export function ProductFormDialog({
  categories,
  product,
  defaultCategoryId,
  allProducts,
}: {
  categories: CategoryOption[];
  product?: ExistingProduct;
  defaultCategoryId?: string;
  allProducts: ProductOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? ""
  );
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [priceInput, setPriceInput] = useState(
    product ? (product.priceCents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [costInput, setCostInput] = useState(
    product?.costCents != null ? (product.costCents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [complementIds, setComplementIds] = useState<string[]>(
    product?.complements.map((c) => c.id) ?? []
  );

  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Preview em tempo real da margem (R$ e %) enquanto o dono digita preço e
  // custo — só cálculo local, nada é salvo até o submit.
  const margin = useMemo(() => {
    const priceCents = parseCentsFromInput(priceInput);
    const costCents = costInput.trim() ? parseCentsFromInput(costInput) : null;
    if (priceCents === null || priceCents <= 0 || costCents === null) return null;
    const marginCents = priceCents - costCents;
    const marginPercent = Math.round((marginCents / priceCents) * 100);
    return { marginCents, marginPercent };
  }, [priceInput, costInput]);

  const complementOptions = allProducts.filter((p) => p.id !== product?.id);

  function toggleComplement(id: string) {
    setComplementIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  // Fecha o dialog quando o submit terminar sem erros (padrão de "reagir a
  // uma mudança" atualizando estado durante a renderização, recomendado
  // pelo React em vez de um useEffect com setState).
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
          product ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil />
            </Button>
          ) : (
            <Button size="sm">
              <Plus />
              Novo produto
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            Esses dados aparecem no cardápio público do seu restaurante.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="isAvailable" value={isAvailable ? "on" : ""} />
          <input type="hidden" name="imageUrl" value={imageUrl} />

          <div className="flex flex-col gap-1.5">
            <Label>Foto</Label>
            <ProductImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={(value) => setCategoryId(String(value))}>
              <SelectTrigger>
                {/* O Base UI só resolve o rótulo automaticamente depois que o
                    popup chega a abrir uma vez (os SelectItem precisam
                    "registrar" o próprio texto); antes disso ele cai para o
                    `value` cru — no nosso caso, o id da categoria. Passar a
                    função de formatação aqui garante o nome certo desde o
                    primeiro render. */}
                <SelectValue placeholder="Selecione uma categoria">
                  {(value: string) =>
                    categories.find((category) => category.id === value)?.name ??
                    "Selecione uma categoria"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.categoryId && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.categoryId}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-name">Nome</Label>
            <Input
              id="product-name"
              name="name"
              placeholder="X-Burguer"
              defaultValue={product?.name}
              required
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-description">Descrição</Label>
            <Textarea
              id="product-description"
              name="description"
              placeholder="Pão, hambúrguer, queijo, alface e tomate"
              defaultValue={product?.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-price">Preço (R$)</Label>
              <Input
                id="product-price"
                name="price"
                placeholder="0,00"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                required
              />
              {state.fieldErrors?.price && (
                <p className="text-xs text-destructive">{state.fieldErrors.price}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-cost">Custo (R$)</Label>
              <Input
                id="product-cost"
                name="cost"
                placeholder="0,00"
                inputMode="decimal"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
              />
              {state.fieldErrors?.cost && (
                <p className="text-xs text-destructive">{state.fieldErrors.cost}</p>
              )}
            </div>
          </div>

          {margin && (
            <p className="-mt-2 text-xs text-muted-foreground">
              Margem:{" "}
              <span
                className={cn(
                  "font-medium",
                  margin.marginCents >= 0 ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {formatCents(margin.marginCents)} · {margin.marginPercent}%
              </span>
            </p>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="product-available">Disponível no cardápio</Label>
            <Switch
              id="product-available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
          </div>

          {complementOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-orange-300" />
                Venda mais — sugerir junto com este produto
              </Label>
              <p className="text-xs text-muted-foreground">
                Selecionados aparecem como &quot;Que tal completar seu pedido?&quot; no
                cardápio público.
              </p>
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] p-2">
                {complementOptions.map((option) => {
                  const selected = complementIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleComplement(option.id)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors",
                        selected
                          ? "bg-gradient-to-r from-orange-500/25 to-rose-500/20 text-orange-200 ring-orange-500/40"
                          : "bg-white/5 text-zinc-400 ring-white/10 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
              {complementIds.map((id) => (
                <input key={id} type="hidden" name="complementIds" value={id} />
              ))}
            </div>
          )}

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending || !categoryId}>
              {isPending ? "Salvando..." : product ? "Salvar alterações" : "Criar produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
