"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ClipboardList,
  ImageIcon,
  MessageCircle,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  User,
  UtensilsCrossed,
} from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCents } from "@/lib/currency";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { ReviewModal } from "@/components/reviews/review-modal";
import { createOrder } from "./actions";

// Guarda o último pedido feito nesta loja (não um "login" de verdade — o
// cardápio público não tem cadastro de cliente) só pra dar continuidade
// entre visitas: pré-preencher nome/telefone no próximo pedido e oferecer
// um atalho de volta pro acompanhamento do último pedido, na aba "Conta"
// do menu inferior.
type LastOrderInfo = {
  orderId: string;
  customerName: string;
  customerPhone: string;
};

function lastOrderStorageKey(slug: string) {
  return `cardapio:${slug}:lastOrder`;
}

function readLastOrder(slug: string): LastOrderInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(lastOrderStorageKey(slug));
    return raw ? (JSON.parse(raw) as LastOrderInfo) : null;
  } catch {
    return null;
  }
}

function writeLastOrder(slug: string, info: LastOrderInfo) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(lastOrderStorageKey(slug), JSON.stringify(info));
  } catch {
    // localStorage indisponível (modo privado, quota etc.) — não é
    // crítico, é só uma conveniência de continuidade entre visitas.
  }
}

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
  restaurantPhone,
  isOpen,
  categories,
}: {
  slug: string;
  restaurantName: string;
  restaurantPhone?: string | null;
  isOpen: boolean;
  categories: Category[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // "Conta" (menu inferior) — sem cadastro/login de cliente, só
  // continuidade entre visitas: nome/telefone e último pedido lidos do
  // localStorage com inicializador preguiçoso do useState (roda 1x, na
  // primeira renderização no client). Diferente de um useEffect, isso não
  // causa re-render em cascata — e não há risco de divergir da
  // renderização do servidor porque esse estado só é usado dentro do
  // Dialog de checkout e do Sheet "Conta", ambos fechados por padrão (o
  // Base UI não monta o conteúdo deles no DOM até serem abertos).
  const [lastOrder, setLastOrder] = useState<LastOrderInfo | null>(() =>
    readLastOrder(slug)
  );
  const [customerName, setCustomerName] = useState(() => readLastOrder(slug)?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(() => readLastOrder(slug)?.customerPhone ?? "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

    const info: LastOrderInfo = {
      orderId: result.orderId,
      customerName,
      customerPhone,
    };
    writeLastOrder(slug, info);
    setLastOrder(info);

    router.push(`/r/${slug}/pedido/${result.orderId}`);
  }

  // Resultado da busca (aba "Busca" do menu inferior) — lista achatada de
  // produtos de todas as categorias cujo nome bate com a busca. Sem
  // scroll-spy nem filtro na página principal: é uma lista separada dentro
  // do próprio sheet, com um atalho de "Adicionar" direto ao carrinho.
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const results: { product: Product; categoryName: string }[] = [];
    for (const category of categories) {
      for (const product of category.products) {
        if (product.name.toLowerCase().includes(query)) {
          results.push({ product, categoryName: category.name });
        }
      }
    }
    return results;
  }, [categories, searchQuery]);

  return (
    <div className="flex flex-col gap-10 pb-28">
      {!isOpen && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          Este restaurante não está aceitando pedidos no momento.
        </div>
      )}

      {/* Navegação rápida por categoria — pílulas com rolagem horizontal,
          estilo app. `sticky` gruda no topo assim que o cliente rola além
          do cabeçalho do restaurante; cada pílula é só uma âncora para a
          seção correspondente (sem scroll-spy, mantém simples e sem
          nenhuma dependência de IntersectionObserver). `scroll-mt-16` em
          cada `<section>` abaixo compensa essa barra fixa ao pular pra lá,
          pra o título da categoria não ficar escondido atrás dela. */}
      {categories.length > 1 && (
        <nav
          aria-label="Categorias"
          className="sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto bg-background/90 px-4 py-2.5 backdrop-blur-xl [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#categoria-${category.id}`}
              className="shrink-0 rounded-full bg-white/[0.04] px-4 py-1.5 text-sm font-medium whitespace-nowrap text-zinc-300 ring-1 ring-white/10 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              {category.name}
            </a>
          ))}
        </nav>
      )}

      {categories.map((category) => (
        <section
          key={category.id}
          id={`categoria-${category.id}`}
          className="flex scroll-mt-16 flex-col gap-3"
        >
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
                // `bottom-20` (em vez do `bottom-5` original) dá espaço pro
                // menu inferior fixo, que ocupa essa faixa no mobile; a
                // partir de `md` o menu inferior já some (`md:hidden`
                // abaixo), então volta a ficar mais perto da borda.
                className="fixed right-4 bottom-20 z-30 flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 py-3 pl-4 pr-5 text-white shadow-xl shadow-orange-950/40 ring-1 ring-white/10 transition-transform active:scale-95 md:right-8 md:bottom-8"
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
              já usado no formulário de produto do painel (max-h + overflow-hidden
              no modal, scroll só na área de conteúdo) — `max-h-[85dvh]`
              (altura de viewport DINÂMICA) em vez de `vh` fixo: no celular,
              quando o teclado abre pra preencher nome/telefone/observações,
              a área visível encolhe; `dvh` acompanha isso e o rodapé com o
              botão "Enviar pedido" (fora da área que rola, ver abaixo)
              nunca fica escondido atrás do teclado. */}
          <DialogContent className="flex max-h-[85dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
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

      {/* Menu inferior fixo, estilo app nativo — só no mobile (`md:hidden`);
          no desktop a navegação por pílulas de categoria já cobre a
          necessidade de navegação rápida, sem precisar de uma barra fixa
          ocupando espaço numa tela grande. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-orange-400"
        >
          <UtensilsCrossed className="size-5" strokeWidth={2.5} />
          Cardápio
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-white"
        >
          <Search className="size-5" strokeWidth={2} />
          Busca
        </button>
        <button
          type="button"
          onClick={() => setAccountOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-white"
        >
          <User className="size-5" strokeWidth={2} />
          Conta
        </button>
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-white"
        >
          <MoreHorizontal className="size-5" strokeWidth={2} />
          Mais
        </button>
      </nav>

      {/* Sheet "Busca" — lista achatada de produtos de todas as categorias
          que batem com o texto digitado, com atalho de adicionar direto ao
          carrinho sem precisar rolar até a seção da categoria.
          `max-h-[85dvh]` (não `vh` fixo) pelo mesmo motivo do checkout
          acima: o campo de busca abre o teclado no celular, e a altura
          dinâmica acompanha o encolhimento da área visível. */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="bottom" className="flex max-h-[85dvh] flex-col overflow-hidden">
          <SheetHeader>
            <SheetTitle className="text-white">Buscar no cardápio</SheetTitle>
            <SheetDescription>
              Digite o nome de um prato ou bebida.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
            <Input
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Ex.: Classic Burger"
            />
            {searchQuery.trim() === "" ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Digite para buscar no cardápio.
              </p>
            ) : searchResults.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum item encontrado para &quot;{searchQuery}&quot;.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {searchResults.map(({ product, categoryName }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {categoryName} · {formatCents(product.priceCents)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!isOpen}
                      className="shrink-0 gap-1 rounded-full"
                      onClick={() => {
                        addToCart(product);
                        toast.success(`${product.name} adicionado ao carrinho.`);
                      }}
                    >
                      <Plus className="size-3.5" />
                      Adicionar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet "Conta" — sem cadastro/login de cliente, então é só
          continuidade entre visitas: nome/telefone pré-preenchidos (salvos
          no localStorage do navegador após o último pedido) e um atalho
          pra acompanhar esse último pedido. */}
      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        {/* `max-h-[85dvh]` + rolagem interna: os campos de nome/telefone
            abrem o teclado no celular, mesmo motivo do checkout/busca
            acima. */}
        <SheetContent side="bottom" className="flex max-h-[85dvh] flex-col overflow-hidden">
          <SheetHeader>
            <SheetTitle className="text-white">Sua conta</SheetTitle>
            <SheetDescription>
              Seus dados ficam salvos neste navegador para agilizar o
              próximo pedido.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            {lastOrder && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  setAccountOpen(false);
                  router.push(`/r/${slug}/pedido/${lastOrder.orderId}`);
                }}
              >
                <ClipboardList className="size-4" />
                Acompanhar meu último pedido
              </Button>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-name">Seu nome</Label>
              <Input
                id="account-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-phone">Telefone / WhatsApp</Label>
              <Input
                id="account-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet "Mais" — avaliação da experiência (o pedido original desta
          tarefa) e um atalho de WhatsApp pro restaurante, quando o
          telefone está configurado em Configurações. */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle className="text-white">Mais opções</SheetTitle>
            <SheetDescription>{restaurantName}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-4">
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setReviewOpen(true);
              }}
              className="flex items-center gap-3 rounded-lg px-2 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              <Star className="size-4 text-orange-300" />
              Avaliar experiência
            </button>
            {restaurantPhone && (
              <a
                href={buildWhatsAppLink(restaurantPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/5"
              >
                <MessageCircle className="size-4 text-emerald-400" />
                Chamar no WhatsApp
              </a>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ReviewModal slug={slug} open={reviewOpen} onOpenChange={setReviewOpen} />
    </div>
  );
}
