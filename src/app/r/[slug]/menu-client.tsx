"use client";

import { useEffect, useMemo, useState, type FocusEvent } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCents } from "@/lib/currency";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { readLastOrder, writeLastOrder, type LastOrderInfo } from "@/lib/last-order";
import { ReviewModal } from "@/components/reviews/review-modal";
import { ActiveOrderPanel } from "@/components/public-menu/active-order-panel";
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
  // Pré-preenche com a mesa do último pedido feito neste navegador — mesmo
  // padrão de nome/telefone acima, e é o que permite "Fazer novo pedido"
  // (ver ActiveOrderPanel) já cair com a mesa certa, sem o cliente precisar
  // digitar de novo.
  const [tableNumber, setTableNumber] = useState(() => readLastOrder(slug)?.tableNumber ?? "");
  const [notes, setNotes] = useState("");
  // Erros de validação amigáveis exibidos junto aos campos obrigatórios do
  // checkout (nome, telefone e mesa/comanda), além do toast.
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [tableError, setTableError] = useState("");

  // Altura do teclado virtual, em px, medida pela Visual Viewport API.
  //
  // O `interactiveWidget: "resizes-content"` declarado em layout.tsx já
  // resolve isso sozinho onde é suportado (Chrome/Android): o layout
  // encolhe e um elemento com `bottom: 0` sobe naturalmente. No Safari/iOS
  // o suporte é inconsistente, e lá o teclado é desenhado POR CIMA da
  // página sem encolher o viewport de layout — resultado: um bottom sheet
  // ancorado em `bottom: 0` fica com a parte de baixo (justamente o botão
  // "Enviar pedido" e os últimos campos) escondida atrás do teclado.
  //
  // A conta abaixo é a diferença entre a altura da janela e a altura da
  // parte REALMENTE visível — que é exatamente o quanto o teclado ocupa.
  // Onde `interactive-widget` já funciona, `window.innerHeight` também
  // encolhe junto e essa conta dá ~0, então os dois mecanismos convivem
  // sem brigar (não dá pra empurrar duas vezes).
  //
  // Tentativa anterior errou o alvo por aplicar isso como `maxHeight` num
  // modal CENTRALIZADO por transform: encolher a altura de algo centrado
  // por `translate(-50%,-50%)` mexe no ponto de ancoragem e o modal
  // "pulava". Ancorado embaixo, o ajuste é só um deslocamento — previsível.
  const [keyboardInset, setKeyboardInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function update() {
      const inset = window.innerHeight - vv!.height - vv!.offsetTop;
      // Ruído de 1-2px acontece só por arredondamento de zoom; só trata
      // como "teclado aberto" a partir de uma faixa que nenhum navegador
      // produz por acidente.
      setKeyboardInset(inset > 80 ? Math.round(inset) : 0);
    }

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  // Ao focar um campo do formulário de checkout, traz o campo pra área
  // visível assim que o teclado termina de abrir. `block: "nearest"` (e não
  // "center") de propósito: dentro de um container que já rola, "center"
  // pede um deslocamento maior do que existe e o iOS Safari compensa
  // rolando a PÁGINA atrás do sheet, que era parte do efeito de "tela
  // cortada". "nearest" move só o mínimo pra o campo aparecer.
  //
  // O atraso existe porque no momento do evento `focus` o teclado ainda
  // está animando: a altura visível (e portanto `keyboardInset` acima)
  // ainda não se estabilizou, então um scroll calculado ali erra o alvo.
  function handleFieldFocus(e: FocusEvent<HTMLElement>) {
    const target = e.currentTarget;
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 350);
  }

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

    // Nome, telefone e mesa/comanda são obrigatórios — validação amigável
    // aqui antes de bater na Server Action, que também valida (defesa em
    // profundidade, ex.: JS desabilitado/chamada direta). Observação
    // continua opcional, sem checagem.
    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();
    const trimmedTable = tableNumber.trim();
    let hasError = false;
    if (trimmedName.length < 2) {
      setNameError("Informe seu nome.");
      hasError = true;
    } else {
      setNameError("");
    }
    if (trimmedPhone.length < 8) {
      setPhoneError("Informe um telefone válido.");
      hasError = true;
    } else {
      setPhoneError("");
    }
    if (!trimmedTable) {
      setTableError("Informe o número da mesa ou comanda.");
      hasError = true;
    } else {
      setTableError("");
    }
    if (hasError) {
      toast.error("Preencha seu nome, telefone e a mesa/comanda para enviar o pedido.");
      return;
    }

    setIsSubmitting(true);
    const result = await createOrder({
      slug,
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      tableNumber: trimmedTable,
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
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      tableNumber: trimmedTable,
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
    // `pb-[calc(...)]` soma a altura reservada pro menu inferior flutuante
    // (ver `<nav>` abaixo) com `env(safe-area-inset-bottom)` — a mesma folga
    // de segurança usada ali —, pra nenhum item do cardápio ficar escondido
    // atrás dele em aparelhos com ou sem barra de gestos/home indicator.
    <div className="flex flex-col gap-10 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {/* Painel flutuante de "sessão ativa" — se o cliente reabrir o
          cardápio (ou escanear o QR Code de novo) e ainda houver um pedido
          em andamento/entregue com a conta em aberto nesta mesa (guardado
          no localStorage deste navegador, ver src/lib/last-order.ts), ele
          aparece aqui por cima do cardápio normal, sem bloquear a
          navegação. Renderizado sempre (mesmo sem `lastOrder` salvo) porque
          a leitura do localStorage só é segura dentro de um efeito no
          próprio componente (evita divergir do HTML renderizado no
          servidor) — o painel decide sozinho, depois de montado, se tem
          algo pra mostrar. */}
      <ActiveOrderPanel slug={slug} />

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
        <Sheet>
          {/* Botão flutuante do carrinho — fica ancorado no canto inferior
              em qualquer tamanho de tela, sem empurrar o conteúdo da
              página (diferente de uma barra fixa em largura total). */}
          <SheetTrigger
            render={
              <button
                type="button"
                // `bottom-[calc(...)]` (em vez de um `bottom-5` fixo) dá
                // espaço pro menu inferior flutuante, que ocupa essa faixa
                // no mobile, já somando a folga de segurança do aparelho
                // (`env(safe-area-inset-bottom)`) — mesma conta usada no
                // padding do conteúdo acima. A partir de `md` o menu
                // inferior já some (`md:hidden` abaixo), então volta a
                // ficar mais perto da borda.
                className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 py-3 pl-4 pr-5 text-white shadow-xl shadow-orange-950/40 ring-1 ring-white/10 transition-transform active:scale-95 md:right-8 md:bottom-8"
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
          {/* Checkout em TELA CHEIA no celular (e bottom sheet só a partir de
              `sm`, onde sobra espaço de monitor).

              Histórico do porquê, pra não voltar atrás: como modal
              centralizado (`top-1/2` + transform) ele descentralizava quando
              o teclado abria; como bottom sheet limitado a `max-h-[85dvh]`
              ele passou a subir certo, mas ENCOLHIA — com o teclado ocupando
              ~40% da tela, sobrava um cartãozinho espremido onde mal cabia um
              campo por vez. A raiz do problema é disputar altura com o
              teclado: qualquer altura fixa que caiba na tela inteira não cabe
              mais quando o teclado sobe.

              A saída é não disputar: em tela cheia o painel ocupa TODO o
              espaço disponível a cada momento. `top-0` + `bottom` (via style,
              descontando o teclado) + a `h-auto` que o componente Sheet já
              aplica no lado "bottom" fazem o elemento esticar entre as duas
              âncoras — sem teclado ocupa a tela toda, com teclado ocupa tudo
              o que sobra acima dele. Como não há mais cartão flutuante, não
              há o que "espremer": só a área de conteúdo (a única que rola)
              muda de tamanho, com cabeçalho e o botão "Enviar pedido" sempre
              fixos nas pontas. É o mesmo padrão dos apps de delivery, onde
              finalizar pedido é uma tela, não uma caixinha.

              A partir de `sm` volta a ser um sheet: `sm:top-auto` devolve a
              altura ao conteúdo, com o teto de 85dvh e cantos arredondados. */}
          <SheetContent
            side="bottom"
            className="top-0 mx-auto flex w-full flex-col gap-0 overflow-hidden p-0 sm:top-auto sm:max-h-[85dvh] sm:max-w-lg sm:rounded-t-2xl"
            style={{
              // Sobe a base do painel exatamente a altura do teclado. Sem
              // teclado, `keyboardInset` é 0 e isso vira `bottom: 0`.
              // (O teto de altura é só do sheet de desktop, via
              // `sm:max-h-[85dvh]` — no celular quem manda é o par
              // top-0/bottom acima, que estica pelo espaço disponível.)
              bottom: keyboardInset,
              // A margem de segurança do aparelho (barra de gestos) só faz
              // sentido com o teclado FECHADO; aberto, quem ocupa a base é o
              // teclado, e somar os dois deixaria uma faixa morta.
              paddingBottom: keyboardInset
                ? 0
                : "env(safe-area-inset-bottom)",
            }}
          >
            <SheetHeader className="gap-0.5 p-4 pb-3">
              <SheetTitle className="text-white">
                Seu pedido — {restaurantName}
              </SheetTitle>
              <SheetDescription>
                Confira os itens e preencha seus dados para enviar o pedido.
              </SheetDescription>
            </SheetHeader>

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
                  <Label htmlFor="customer-name">
                    Seu nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    onFocus={handleFieldFocus}
                    placeholder="Como podemos te chamar?"
                    required
                    aria-invalid={nameError ? true : undefined}
                    aria-describedby={nameError ? "customer-name-error" : undefined}
                    className={nameError ? "border-red-500 focus-visible:ring-red-500/40" : undefined}
                  />
                  {nameError && (
                    <p id="customer-name-error" className="text-xs text-red-400">
                      {nameError}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customer-phone">
                    Telefone / WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (phoneError) setPhoneError("");
                    }}
                    onFocus={handleFieldFocus}
                    placeholder="(11) 99999-9999"
                    required
                    aria-invalid={phoneError ? true : undefined}
                    aria-describedby={phoneError ? "customer-phone-error" : undefined}
                    className={phoneError ? "border-red-500 focus-visible:ring-red-500/40" : undefined}
                  />
                  {phoneError && (
                    <p id="customer-phone-error" className="text-xs text-red-400">
                      {phoneError}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="table-number">
                    Mesa / Comanda <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="table-number"
                    value={tableNumber}
                    onChange={(e) => {
                      setTableNumber(e.target.value);
                      if (tableError) setTableError("");
                    }}
                    onFocus={handleFieldFocus}
                    placeholder="Ex.: 12"
                    required
                    aria-invalid={tableError ? true : undefined}
                    aria-describedby={tableError ? "table-number-error" : undefined}
                    className={tableError ? "border-red-500 focus-visible:ring-red-500/40" : undefined}
                  />
                  {tableError && (
                    <p id="table-number-error" className="text-xs text-red-400">
                      {tableError}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="order-notes">Observações (opcional)</Label>
                  <Textarea
                    id="order-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onFocus={handleFieldFocus}
                    placeholder="Sem cebola, ponto da carne, etc."
                  />
                </div>
              </div>
            </div>

            {/* Rodapé de UMA linha só: o total mora DENTRO do botão, em vez
                de numa faixa "Total ————— R$ X" separada acima dele. Com o
                teclado aberto no celular cada linha do rodapé é espaço que
                falta no formulário — juntar as duas devolve ~40px (quase
                meio campo) sem esconder o valor do cliente, que continua
                vendo quanto vai pagar antes de confirmar. Mesmo padrão dos
                apps de delivery. */}
            <div className="mt-auto border-t border-border p-4">
              <Button
                className="h-12 w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-600/20 hover:from-orange-400 hover:to-rose-400"
                disabled={isSubmitting || !isOpen}
                onClick={handleCheckout}
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <span className="flex items-center gap-2 text-base font-semibold">
                    Enviar pedido
                    {/* Ponto separador puramente decorativo — escondido de
                        leitores de tela, que já leem "Enviar pedido R$ X". */}
                    <span aria-hidden className="opacity-60">
                      ·
                    </span>
                    {formatCents(totalCents)}
                  </span>
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Menu inferior fixo, estilo app nativo — só no mobile (`md:hidden`);
          no desktop a navegação por pílulas de categoria já cobre a
          necessidade de navegação rápida, sem precisar de uma barra fixa
          ocupando espaço numa tela grande. Colado nas bordas
          (`inset-x-0 bottom-0`), sem vão embaixo — uma versão anterior
          tinha virado um cartão flutuante com margem e respiro embaixo
          (`inset-x-3` + `bottom-3`), mas isso deixava um vão vazio entre a
          barra e a borda da tela, um padrão menos "nativo" que apps de
          referência do setor não usam (eles vão até a borda). O respiro de
          segurança pra não colar em cima da barra de gestos/home indicator
          continua existindo, só que como padding INTERNO da própria barra
          (`pb-[env(safe-area-inset-bottom)]`, empurra os botões pra cima,
          mas o fundo da barra continua preenchendo até a borda física da
          tela) em vez de margem externa. IMPORTANTE: esse `env()` só devolve
          um valor real por causa do `viewportFit: "cover"` declarado em
          src/app/layout.tsx — sem aquilo, ele resolve 0px e essa linha vira
          letra morta.

          Fundo `bg-[#121212]` SÓLIDO (antes era `bg-popover/95` +
          `backdrop-blur-xl`): translúcido deixava o conteúdo do cardápio
          aparecer por trás da barra ao rolar, o que lia como acabamento
          inacabado ao lado de apps do setor, que usam barra opaca. O blur
          saiu junto porque não tem mais o que borrar — e ainda economiza
          composição de camada no celular. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/10 bg-[#121212] pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.35)] md:hidden">
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
          carrinho sem precisar rolar até a seção da categoria. O campo de
          busca tem `autoFocus`, ou seja, o teclado abre junto com o sheet —
          então recebe o MESMO deslocamento por `keyboardInset` do checkout
          (ver comentário lá em cima), senão a lista de resultados nasce
          escondida atrás do teclado. */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent
          side="bottom"
          className="flex flex-col overflow-hidden"
          style={{
            bottom: keyboardInset,
            maxHeight: keyboardInset
              ? `calc(100dvh - ${keyboardInset}px - 1rem)`
              : "85dvh",
          }}
        >
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
