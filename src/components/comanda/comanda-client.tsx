"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Send, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCents } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { createStaffOrder } from "@/app/(dashboard)/dashboard/comanda/actions";

type Product = {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
};

type Category = {
  id: string;
  name: string;
  products: Product[];
};

type CartLine = { product: Product; quantity: number };

export function ComandaClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id ?? ""
  );
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const lines = useMemo(() => Object.values(cart), [cart]);
  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalCents = lines.reduce(
    (sum, line) => sum + line.product.priceCents * line.quantity,
    0
  );

  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0];

  function changeQuantity(product: Product, delta: number) {
    setCart((prev) => {
      const existing = prev[product.id];
      const nextQuantity = (existing?.quantity ?? 0) + delta;
      if (nextQuantity <= 0) {
        return Object.fromEntries(
          Object.entries(prev).filter(([id]) => id !== product.id)
        );
      }
      return { ...prev, [product.id]: { product, quantity: nextQuantity } };
    });
  }

  async function handleSubmit() {
    if (!tableNumber.trim()) {
      toast.error("Informe o número da mesa.");
      return;
    }
    if (lines.length === 0) {
      toast.error("Adicione pelo menos um item.");
      return;
    }

    setIsSubmitting(true);
    const result = await createStaffOrder({
      tableNumber: tableNumber.trim(),
      notes: notes || undefined,
      items: lines.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
      })),
    });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`Pedido enviado para a cozinha — Mesa ${tableNumber}!`);
    // Mantém a mesa preenchida (comum lançar mais de uma comanda seguida na
    // mesma mesa), mas limpa o carrinho e observações do pedido enviado.
    setCart({});
    setNotes("");
    setCartOpen(false);
    router.refresh();
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum produto disponível no cardápio ainda. Cadastre produtos em
          Cardápio para começar a lançar comandas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Mesa — fixo no topo, é a primeira coisa que o garçom precisa
          preencher antes de lançar qualquer item. */}
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 md:top-0">
        <Label htmlFor="comanda-table" className="shrink-0 text-sm text-white">
          Mesa
        </Label>
        <Input
          id="comanda-table"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          placeholder="Ex.: 12"
          className="max-w-32"
          inputMode="numeric"
        />
      </div>

      {/* Categorias — chips com rolagem horizontal, mais rápido de tocar
          numa tela pequena do que abas fixas. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategoryId(category.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition-colors",
              category.id === activeCategory?.id
                ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white ring-orange-500/30"
                : "bg-white/[0.03] text-muted-foreground ring-white/10 hover:text-white"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Produtos da categoria ativa — linhas compactas com stepper, sem
          imagem, priorizando velocidade de lançamento. */}
      <div className="flex flex-col gap-1.5 rounded-2xl bg-white/[0.02] p-2 ring-1 ring-white/5">
        {activeCategory?.products.map((product) => {
          const quantity = cart[product.id]?.quantity ?? 0;
          return (
            <div
              key={product.id}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {product.name}
                </p>
                <p className="text-xs text-orange-300">
                  {formatCents(product.priceCents)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {quantity > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="rounded-full"
                      onClick={() => changeQuantity(product, -1)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-4 text-center text-sm text-white">
                      {quantity}
                    </span>
                  </>
                )}
                <Button
                  size="icon-sm"
                  className="rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-400 hover:to-rose-400"
                  onClick={() => changeQuantity(product, 1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {totalItems > 0 && (
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className="fixed bottom-20 right-4 z-30 flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 py-3 pl-4 pr-5 text-white shadow-xl shadow-orange-950/40 ring-1 ring-white/10 transition-transform active:scale-95 md:bottom-8 md:right-8"
              >
                <span className="relative flex items-center">
                  <ShoppingCart className="size-5" />
                  <span className="absolute -top-2.5 -right-2.5 flex size-4.5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-orange-600">
                    {totalItems}
                  </span>
                </span>
                <span className="text-sm font-semibold">
                  {formatCents(totalCents)}
                </span>
              </button>
            }
          />
          <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-white">
                Comanda — {tableNumber ? `Mesa ${tableNumber}` : "sem mesa"}
              </SheetTitle>
              <SheetDescription>
                Confira os itens antes de enviar para a cozinha.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
              <div className="flex flex-col gap-1 rounded-xl bg-white/[0.03] p-2 ring-1 ring-white/5">
                {lines.map((line) => (
                  <div
                    key={line.product.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {line.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCents(line.product.priceCents)} cada
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="rounded-full"
                        onClick={() => changeQuantity(line.product, -1)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-4 text-center text-sm text-white">
                        {line.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="rounded-full"
                        onClick={() => changeQuantity(line.product, 1)}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comanda-notes">Observações (opcional)</Label>
                <Textarea
                  id="comanda-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sem cebola, ponto da carne, etc."
                />
              </div>
            </div>

            <SheetFooter>
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-semibold text-orange-300">
                  {formatCents(totalCents)}
                </span>
              </div>
              <Button
                className="w-full gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-600/20 hover:from-orange-400 hover:to-rose-400"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                <Send className="size-4" />
                {isSubmitting ? "Enviando..." : "Enviar para a cozinha"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
