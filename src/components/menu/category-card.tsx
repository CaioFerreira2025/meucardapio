"use client";

import { useTransition } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ProductRow } from "@/components/menu/product-row";
import { deleteCategory, moveCategory } from "@/app/(dashboard)/dashboard/menu/actions";

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

export function CategoryCard({
  category,
  products,
  allCategories,
  allProducts,
  isFirst,
  isLast,
}: {
  category: { id: string; name: string };
  products: Product[];
  allCategories: { id: string; name: string }[];
  allProducts: ProductOption[];
  // Posição da categoria na lista já ordenada (ver page.tsx) — controla
  // se as setas de subir/descer ficam habilitadas. A primeira categoria
  // não tem pra onde subir, a última não tem pra onde descer.
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isMoving, startMoveTransition] = useTransition();

  function handleMove(direction: "up" | "down") {
    startMoveTransition(() => moveCategory(category.id, direction));
  }

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-rose-500" />
          <CardTitle className="text-white">{category.name}</CardTitle>
          <span className="text-xs font-normal text-muted-foreground">
            ({products.length})
          </span>
        </div>
        <CardAction className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.03] p-0.5 ring-1 ring-white/10">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Mover categoria para cima"
              disabled={isFirst || isMoving}
              onClick={() => handleMove("up")}
            >
              <ChevronUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Mover categoria para baixo"
              disabled={isLast || isMoving}
              onClick={() => handleMove("down")}
            >
              <ChevronDown />
            </Button>
          </div>
          <ProductFormDialog
            categories={allCategories}
            defaultCategoryId={category.id}
            allProducts={allProducts}
          />
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="icon-sm" disabled={isPending}>
                  <Trash2 />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{category.name}&quot; e todos os seus produtos ({products.length})
                  serão removidos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => startTransition(() => deleteCategory(category.id))}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardAction>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            Nenhum produto nessa categoria ainda.
          </p>
        ) : (
          products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              categories={allCategories}
              allProducts={allProducts}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
