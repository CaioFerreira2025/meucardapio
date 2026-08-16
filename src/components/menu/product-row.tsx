"use client";

import { useTransition } from "react";
import Image from "next/image";
import { ImageIcon, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductFormDialog } from "@/components/menu/product-form-dialog";
import { formatCents } from "@/lib/currency";
import {
  deleteProduct,
  toggleProductAvailability,
} from "@/app/(dashboard)/dashboard/menu/actions";

type Product = {
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

type ProductOption = { id: string; name: string; categoryName: string };

export function ProductRow({
  product,
  categories,
  allProducts,
}: {
  product: Product;
  categories: { id: string; name: string }[];
  allProducts: ProductOption[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="group flex items-center justify-between gap-4 border-b border-border py-3 transition-colors last:border-b-0 hover:bg-white/[0.02]">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-white/5">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
              // Upload de produto vira uma data: URL (ver src/lib/uploads.ts)
              // — o otimizador do Next não processa isso, então só pulamos a
              // otimização nesse caso. URLs remotas (ex.: fotos curadas do
              // cardápio de demonstração) passam pelo otimizador normalmente,
              // o que é mais rápido e mais leve para quem acessa o painel.
              unoptimized={product.imageUrl.startsWith("data:")}
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageIcon className="size-5 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {product.name}
            </p>
          </div>
          {product.description && (
            <p className="truncate text-xs text-muted-foreground">
              {product.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-orange-300">
              {formatCents(product.priceCents)}
            </p>
            {typeof product.costCents === "number" && product.costCents > 0 && (
              <p className="text-xs text-muted-foreground">
                margem{" "}
                <span
                  className={cn(
                    "font-medium",
                    product.priceCents - product.costCents >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  )}
                >
                  {formatCents(product.priceCents - product.costCents)}
                  {" · "}
                  {Math.round(
                    ((product.priceCents - product.costCents) / product.priceCents) * 100
                  )}
                  %
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ring-1 sm:inline-flex",
            product.isAvailable
              ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
              : "bg-rose-500/15 text-rose-300 ring-rose-500/25"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              product.isAvailable ? "bg-emerald-400" : "bg-rose-400"
            )}
          />
          {product.isAvailable ? "Disponível" : "Indisponível"}
        </span>
        <Switch
          checked={product.isAvailable}
          disabled={isPending}
          onCheckedChange={(checked) =>
            startTransition(() => toggleProductAvailability(product.id, checked))
          }
        />
        <ProductFormDialog
          categories={categories}
          product={product}
          allProducts={allProducts}
        />
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="icon-sm">
                <Trash2 />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{product.name}&quot; será removido do cardápio permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => startTransition(() => deleteProduct(product.id))}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
