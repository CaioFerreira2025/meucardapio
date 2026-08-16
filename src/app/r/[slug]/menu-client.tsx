"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageIcon, Minus, Plus, ShoppingCart, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCents } from "@/lib/currency";
import { createOrder } from "./actions";

type ComplementProduct = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  complements: ComplementProduct[];
};

type Category = {
  id: string;
  name: string;
  products: Product[];
};

type CartLine = { product: Product; quantity: number };

export function MenuClient({
  slug,
  restaurantName,
  isOpen,
  categories,
}: {
  slug: string;
  restaurantName: string;
  isOpen: boolean;
  categories: Category[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");

  const lines = useMemo(() => Object.values(cart), [cart]);
  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalCents = lines.reduce(
    (sum, line) => sum + line.product.priceCents * line.quantity,
    0
  );

  // Mapa achatado de todos os produtos disponíveis — usado para resolver um
  // complementar (Venda Mais) num Product completo ao adicionar ao carrinho.
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const category of categories) {
      for (const p of category.products) map.set(p.id, p);
    }
    return map;
  }, [categories]);

  // "Venda mais": produtos complementares dos itens já no carrinho, sem
  // repetir o que já está lá — sugestão simples baseada no que o dono do
  // restaurante configurou por produto no painel.
  const suggestions = useMemo(() => {
    const seen = new Map<string, Product>();
    for (const line of lines) {
      for (const complement of line.product.complements) {
        if (cart[complement.id] || seen.has(complement.id)) continue;
        const full = productMap.get(complement.id);
        if (full) seen.set(complement.id, full);
      }
    }
    return Array.from(seen.values()).slice(0, 4);
  }, [lines, cart, productMap]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: (existing?.quantity ?? 0) + 1,
        },
      };
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const nextQuantity = existing.quantity + delta;
      if (nextQuantity <= 0) {
        return Object.fromEntries(
          Object.entries(prev).filter(([id]) => id !== productId)
        );
      }
      return { ...prev, [productId]: { ...existing, quantity: nextQuantity } };
    });
  }

  async function handleCheckout() {
    if (lines.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Preencha seu nome e telefone.");
      return;
    }

    setIsSubmitting(true);
    const result = await createOrder({
      slug,
      customerName,
      customerPhone,
      tableNumber: tableNumber || undefined,
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

    router.push(`/r/${slug}/pedido/${result.orderId}`);
  }

  return (
    <div className="flex flex-col gap-10 pb-28">
      {!isOpen && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          Este restaurante não está aceitando pedidos no momento.
        </div>
      )}

      {categories.map((category) => (
        <section key={category.id} className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
            {category.name}
            <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {category.products.map((product) => (
              <Card key={product.id} className="gap-0 overflow-hidden py-0">
                <div className="relative aspect-[4/3] w-full shrink-0 bg-white/5">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(min-width: 640px) 380px, 100vw"
                      className="object-cover"
                      // Upload de produto vira uma data: URL (ver
                      // src/lib/uploads.ts) — o otimizador do Next não
                      // processa isso, então só pulamos a otimização nesse
                      // caso. Fotos remotas (ex.: cardápio de demonstração)
                      // passam pelo otimizador normalmente.
                      unoptimized={product.imageUrl.startsWith("data:")}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ImageIcon className="size-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardHeader className="gap-1 pt-4 pb-1">
                  <CardTitle className="text-base text-white">
                    {product.name}
                  </CardTitle>
                  {product.description && (
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-2 pb-4">
                  <span className="text-base font-semibold text-orange-300">
                    {formatCents(product.priceCents)}
                  </span>
                  <Button
                    size="sm"
                    disabled={!isOpen}
                    className="gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-600/20 hover:from-orange-400 hover:to-rose-400"
                    onClick={() => addToCart(product)}
                  >
                    <Plus className="size-4" />
                    Adicionar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {totalItems > 0 && (
        <Dialog>
          {/* Botão flutuante do carrinho — fica ancorado no canto inferior
              em qualquer tamanho de tela, sem empurrar o conteúdo da
              página (diferente de uma barra fixa em largura total). */}
          <DialogTrigger
            render={
              <button
                type="button"
                className="fixed bottom-5 right-4 z-30 flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 py-3 pl-4 pr-5 text-white shadow-xl shadow-orange-950/40 ring-1 ring-white/10 transition-transform active:scale-95 sm:bottom-8 sm:right-8"
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
          {/* Checkout como modal central flutuante — antes era um sheet
              lateral (side="right") que, no celular, ficava só com 75% da
              largura por causa de uma regra de especificidade do
              componente Sheet (data-[side=right]:w-3/4 tem mais
              especificidade que a largura passada via className), dando a
              impressão de barra lateral espremida. Um Dialog centralizado
              resolve isso de raiz e dá bem mais espaço pros campos do
              formulário. Mesmo padrão de "modal alto com rolagem interna"
              já usado no formulário de produto do painel (max-h-[90vh] +
              overflow-hidden no modal, scroll só na área de conteúdo). */}
          <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
            <DialogHeader className="gap-0.5 p-4 pb-3">
              <DialogTitle className="text-white">
                Seu pedido — {restaurantName}
              </DialogTitle>
              <DialogDescription>
                Confira os itens e preencha seus dados para enviar o pedido.
              </DialogDescription>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
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
                        onClick={() => changeQuantity(line.product.id, -1)}
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
                        onClick={() => changeQuantity(line.product.id, 1)}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {suggestions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <Sparkles className="size-3.5 text-orange-300" />
                    Que tal completar seu pedido?
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2 ring-1 ring-white/5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">{suggestion.name}</p>
                          <p className="text-xs text-orange-300">
                            {formatCents(suggestion.priceCents)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 gap-1 rounded-full"
                          onClick={() => addToCart(suggestion)}
                        >
                          <Plus className="size-3.5" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customer-name">Seu nome</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customer-phone">Telefone / WhatsApp</Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="table-number">Mesa (opcional)</Label>
                  <Input
                    id="table-number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="order-notes">Observações</Label>
                  <Textarea
                    id="order-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sem cebola, ponto da carne, etc."
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-semibold text-orange-300">
                  {formatCents(totalCents)}
                </span>
              </div>
              <Button
                className="w-full gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-600/20 hover:from-orange-400 hover:to-rose-400"
                disabled={isSubmitting || !isOpen}
                onClick={handleCheckout}
              >
                {isSubmitting ? "Enviando..." : "Enviar pedido"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
