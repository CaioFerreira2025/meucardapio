# CardápioPontoCom

SaaS de cardápio digital e pedidos para restaurantes/lanchonetes. Stack:
Next.js 16 (App Router) + Prisma + Auth.js + shadcn/ui + Stripe. Este README
cobre o que foi entregue nas Fases 0, 1, 2, 3, 4 e 5.

## Stack

- **Next.js 16** — App Router, TypeScript, Turbopack
- **Tailwind CSS v4 + shadcn/ui** — base do design system (componentes em
  `src/components/ui`, fácil de re-skinar com os tokens do seu design system)
- **Prisma ORM** — schema em `prisma/schema.prisma`, SQLite em dev
  (`prisma/dev.db`), pronto para trocar para Postgres em produção
- **Auth.js (NextAuth v5)** — login/cadastro por email e senha, sessão JWT
- **Stripe** — planos, checkout, portal do cliente e webhook de assinatura

## Como rodar localmente

```bash
npm install          # instala dependências e já gera o Prisma Client (postinstall)
npm run db:migrate    # aplica as migrations no banco local (se ainda não rodou)
npm run db:seed       # opcional: cria um usuário de teste
npm run dev            # inicia o servidor de desenvolvimento
```

Abra [http://localhost:3000](http://localhost:3000).

Usuário de teste (criado pelo `db:seed`), já com um restaurante, uma
categoria, um produto e um pedido de exemplo:

- **Email:** demo@example.com
- **Senha:** demo12345
- **Cardápio público:** http://localhost:3000/r/lanchonete-do-joao

## Variáveis de ambiente

Copie `.env.example` para `.env` (o `.env` já vem preenchido para dev local,
mas em produção gere seus próprios valores):

- `DATABASE_URL` — connection string do banco (SQLite em dev; Postgres em
  produção)
- `AUTH_SECRET` — chave para assinar sessões/JWT (gere com
  `openssl rand -base64 32`)
- `NEXTAUTH_URL` — URL base da aplicação
- `AUTH_TRUST_HOST` — necessário atrás de proxy/porta diferente da
  `NEXTAUTH_URL` (Docker, PaaS, etc.)
- `NEXT_PUBLIC_APP_URL` — URL pública usada nos redirects do Stripe
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — chaves do Stripe (ver
  seção "Configurar o Stripe" abaixo)
- `STRIPE_PRICE_ID_STARTER` / `STRIPE_PRICE_ID_PRO` — Price IDs dos planos

**Sem as chaves do Stripe, o resto do app funciona normalmente** — as rotas
de checkout/portal/webhook só retornam um erro claro em vez de derrubar o
build ou o servidor.

## Configurar o Stripe

1. Crie uma conta em [stripe.com](https://stripe.com) e pegue as chaves de
   teste em `Developers > API keys` → cole em `STRIPE_SECRET_KEY`.
2. Em `Products`, crie os produtos "Starter" e "Pro" (ou os planos que
   fizerem sentido — edite `src/config/plans.ts` se os nomes/preços forem
   outros) e copie o **Price ID** de cada um (começa com `price_...`, não
   confundir com o Product ID) para `STRIPE_PRICE_ID_STARTER` /
   `STRIPE_PRICE_ID_PRO`.
3. Para testar o webhook localmente, instale a [Stripe CLI](https://stripe.com/docs/stripe-cli)
   e rode `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
   O comando imprime um `whsec_...` — cole em `STRIPE_WEBHOOK_SECRET`.
4. Em produção, crie o endpoint de webhook pelo Dashboard do Stripe
   apontando para `https://SEU_DOMINIO/api/webhooks/stripe` e use o
   `whsec_...` gerado lá.

## Estrutura de pastas

```
prisma/
  schema.prisma       # User, Subscription, Restaurant, Category, Product, Order...
  migrations/          # histórico de migrations
  seed.ts               # dados de exemplo para dev
src/
  app/
    (auth)/            # layout + páginas de login e cadastro (públicas)
    (dashboard)/        # layout protegido (exige restaurante) + painel
      dashboard/
        menu/            # gestão de categorias e produtos
        orders/            # gestão de pedidos
        billing/            # assinatura/cobrança
    onboarding/          # criação do restaurante (1º acesso)
    pricing/             # página pública de planos
    r/[slug]/             # cardápio público do restaurante
      pedido/[orderId]/     # acompanhamento do pedido (cliente final)
    api/
      auth/[...nextauth]/  # rota do Auth.js
      register/             # criação de usuário (hash de senha)
      checkout/              # cria a sessão de Stripe Checkout
      billing-portal/         # cria a sessão do Stripe Customer Portal
      webhooks/stripe/         # sincroniza assinaturas vindas do Stripe
      upload/                   # recebe o upload de imagem de produto
      uploads/products/[restaurantId]/[filename]/  # serve as imagens (disco)
      dashboard/orders/stream/  # endpoint SSE de notificações em tempo real
    page.tsx              # landing page
    layout.tsx             # layout raiz (fontes, Toaster)
  auth.ts                # configuração do Auth.js (providers, callbacks)
  config/
    plans.ts               # definição dos planos (nome, preço, price ID)
    brand.ts                # nome/tagline da marca (CardápioPontoCom) — ver Fase 6
    demo-images.ts            # fotos curadas dos mockups/cardápio de demonstração
  components/
    ui/                    # componentes shadcn/ui
    layout/                 # DashboardShell (sidebar desktop / bottom nav mobile do
                              # painel, tema escuro)
    theme/                    # DarkPortalRoot — ver Fase 5 abaixo
    brand/                     # Logo/LogoMark/LogoWordmark — ver Fase 6
    landing/                    # seções da landing (hero, bento de benefícios,
                                  # como funciona, planos, demo, header/footer
                                  # compartilhados com /pricing) + Reveal/TiltCard/
                                  # FloatingIcon/FloatingChip (animações reutilizáveis)
    auth/                   # formulários de login/cadastro
    billing/                 # botões de checkout, planos (PricingCards) e gerenciar
                               # assinatura
    menu/                    # dialogs de categoria/produto (painel) + upload de imagem
    orders/                   # card e badge de status de pedido + notificações (toast/SSE)
    dashboard/                # StatCard, CopyLinkButton (visão geral do painel)
  lib/
    prisma.ts               # singleton do PrismaClient
    stripe.ts                 # singleton do client Stripe
    site.ts                    # URL base do app
    restaurant.ts               # busca do restaurante (por dono/slug)
    slug.ts                      # geração de URL amigável
    currency.ts                   # formatação/parse de preço (centavos)
    order-status.ts                 # labels e fluxo de status do pedido
    uploads.ts                       # salva imagem de produto como base64 no banco
                                       # (+ leitura/remoção de imagens antigas em disco,
                                       # mantidas só por compatibilidade)
    uploads-shared.ts                 # constantes de upload usadas no client e no server
    order-events.ts                    # pub/sub em memória (EventEmitter) para o SSE
    validations/                        # schemas zod
uploads/
  products/[restaurantId]/[arquivo]  # legado: imagens no formato antigo (disco, fora
                                       # de `public/`, gitignored) — novos uploads não
                                       # usam mais esse diretório, ver src/lib/uploads.ts
```

## Scripts

| Comando              | O que faz                                       |
| --------------------- | ------------------------------------------------ |
| `npm run dev`          | Servidor de desenvolvimento (Turbopack)           |
| `npm run build`        | Build de produção                                 |
| `npm run start`        | Serve o build de produção                         |
| `npm run lint`         | ESLint                                            |
| `npm run db:migrate`   | Cria/aplica migrations do Prisma em dev           |
| `npm run db:push`      | Sincroniza o schema sem gerar migration (protótipo) |
| `npm run db:studio`    | Abre o Prisma Studio (GUI do banco)               |
| `npm run db:seed`      | Popula o banco com um usuário de teste            |

## O que já está pronto

**Fase 0 — infraestrutura**
- Projeto Next.js configurado com TypeScript, Tailwind e ESLint
- shadcn/ui inicializado com os componentes base (button, card, input,
  dropdown, dialog, sheet, table, tabs, etc.)
- Prisma + SQLite, pronto para trocar para Postgres em produção

**Fase 1 — autenticação**
- Cadastro (`/register`) e login (`/login`) por email/senha via Auth.js,
  com hash de senha (bcrypt) e validação (zod)
- Rota `/dashboard` protegida (redireciona para `/login` sem sessão)
- Landing page pública com header dinâmico (mostra login/cadastro ou o
  menu do usuário conforme a sessão)

**Fase 2 — cobrança (Stripe)**
- Modelo `Subscription` no Prisma + `stripeCustomerId` no `User`
- Página pública `/pricing` com os planos e botão de assinar
- Checkout via Stripe (`/api/checkout`) — cria/reaproveita o customer e
  redireciona para o Stripe Checkout
- Portal do cliente (`/api/billing-portal`) para o usuário gerenciar a
  própria assinatura (trocar cartão, cancelar, etc.)
- Webhook (`/api/webhooks/stripe`) que sincroniza status, plano e data de
  renovação da assinatura no banco
- `/dashboard/billing` mostra o plano atual, status e data de
  renovação/cancelamento

**Fase 3 — painel do cliente e cardápio digital (CardápioPontoCom)**
- Cada usuário dono de restaurante tem 1 `Restaurant` (nome, URL pública
  `/r/[slug]`, telefone, endereço); onboarding obrigatório no primeiro
  acesso ao painel
- `/dashboard/menu` — CRUD de categorias e produtos (nome, descrição,
  preço, disponibilidade), via Server Actions
- `/dashboard/orders` — lista de pedidos (em aberto / histórico) com os
  itens, dados do cliente e botão para avançar o status
  (recebido → em preparo → pronto → concluído, ou cancelar)
- `/r/[slug]` — cardápio público, sem necessidade de login: carrinho
  client-side, formulário de dados do cliente e envio do pedido
- `/r/[slug]/pedido/[orderId]` — página pública de acompanhamento do
  pedido para o cliente final
- Preços são guardados em centavos (`priceCents`) para evitar erros de
  ponto flutuante; o total do pedido é sempre recalculado no servidor a
  partir do preço atual do produto (nunca confia no valor enviado pelo
  cliente)

**Fase 4 — upload de imagens e notificações em tempo real**

- **Upload de imagem dos produtos**
  - `/api/upload` recebe o arquivo (autenticado, valida que o produto/
    restaurante é do usuário logado), aceita JPG/PNG/WebP até 1,5MB
    (`src/lib/uploads-shared.ts`)
  - **Armazenamento: data URL (base64) direto na coluna `imageUrl` do
    banco** — nenhum arquivo é escrito em disco. A primeira versão desta
    funcionalidade salvava os arquivos fora de `public/` e os servia por
    uma rota dinâmica (isso era necessário porque o `next start` não passa
    a servir arquivos adicionados a `public/` depois que o servidor já
    subiu). Essa abordagem funcionou nos nossos testes, mas se mostrou
    frágil em condições que não conseguimos reproduzir remotamente — na
    prática, a foto podia não aparecer no cardápio público dependendo do
    ambiente (build desatualizado, permissões/filesystem do host, etc.).
    Guardar a imagem como base64 direto no banco elimina essa classe de
    problema: não depende de escrita em disco, de uma rota separada estar
    no ar, nem de reiniciar o servidor — a imagem é parte do HTML da
    página, não um link para outro lugar, então **sempre** aparece.
  - `src/app/api/uploads/products/[restaurantId]/[filename]/route.ts`
    (a rota dinâmica que servia os arquivos em disco) continua no projeto
    só por compatibilidade, caso ainda existam produtos com imagens no
    formato antigo — novos uploads não passam mais por ela
  - Ao trocar ou remover a imagem de um produto (ou excluir produto/
    categoria), `deleteProductImage` só tem o que fazer para imagens
    antigas em disco; para data URLs é um no-op (não há arquivo para
    apagar — o valor antigo é simplesmente substituído/removido da linha
    no banco)
  - **Trade-off consciente:** cada produto com foto deixa a página do
    cardápio público mais pesada (a imagem vai embutida no HTML, sem cache
    HTTP próprio) — por isso o limite de 1,5MB por imagem. Para um
    cardápio de restaurante/lanchonete (dezenas de produtos) isso é um
    preço baixo pela confiabilidade. Se o cardápio crescer muito, troque
    `saveProductImage` em `src/lib/uploads.ts` por um provedor de object
    storage (Vercel Blob, S3, Cloudflare R2, Cloudinary, UploadThing...) —
    a assinatura da função pode continuar igual, só o corpo muda para
    fazer upload ao provedor e devolver a URL dele
- **Notificações em tempo real de pedidos**
  - `/api/dashboard/orders/stream` é um endpoint SSE (Server-Sent Events)
    autenticado que mantém a conexão aberta e envia eventos
    (`new_order`, `status_changed`) do restaurante do usuário logado, com
    heartbeat a cada 25s para não cair em proxies/timeouts
  - No client, `OrderNotifications` (montado no layout do painel) abre uma
    `EventSource`, mostra um toast quando chega um pedido novo e atualiza
    os dados da página (`router.refresh()`) — o `EventSource` já reconecta
    sozinho em caso de queda
  - Os eventos são emitidos via `src/lib/order-events.ts`, um `EventEmitter`
    em memória guardado em `globalThis` (mesmo padrão do singleton do
    Prisma, mas fixado em `globalThis` **sempre**, inclusive em produção —
    diferente do Prisma, que só faz isso fora de produção). Isso foi
    necessário porque o `next start` empacota rotas/Server Actions em
    módulos separados; sem fixar em `globalThis` em produção, a rota SSE e
    as actions que emitem eventos (`createOrder`, `updateOrderStatus`)
    acabavam com instâncias diferentes do emitter no mesmo processo, e os
    eventos nunca chegavam ao painel — bug encontrado e corrigido durante
    o teste de ponta a ponta desta fase (testado com o servidor de
    produção real via `next start`: pedido criado no cardápio público
    chega como toast no painel em outra aba, e mudança de status também)
  - **Limitação importante:** só funciona dentro de um único processo
    Node.js (`next start` num VPS/Docker, ou `next dev`) — o mesmo modelo
    já assumido pelo SQLite. Em plataformas serverless com múltiplas
    instâncias (Vercel, etc.), cada instância tem sua própria memória, e um
    pedido criado numa instância não chega às conexões SSE abertas em
    outra. Para produção nesse tipo de ambiente, troque por um serviço de
    pub/sub real (Pusher, Ably, Supabase Realtime, Redis pub/sub)

**Fase 5 — design system premium (painel e cardápio público)**

- Tema escuro (`.dark` em `src/app/globals.css`) com paleta zinc + acentos
  laranja/rosa (oklch), igual à identidade da landing page. Como todo
  componente em `src/components/ui` usa tokens semânticos (`bg-card`,
  `bg-popover`, `text-muted-foreground`, etc.) em vez de cores fixas, mudar
  esses tokens re-temiza Dialog, Select, Switch, Badge, Sheet, AlertDialog e
  companhia automaticamente. `Card` ganhou um acabamento "glass" (`dark:` —
  fundo translúcido com blur) que só se aplica dentro do tema escuro
- `DashboardShell` (`src/components/layout/dashboard-shell.tsx`) substitui o
  header/nav antigos: sidebar fixa no desktop, barra de abas fixa no mobile
- `/dashboard` (visão geral), `/dashboard/menu`, `/dashboard/orders` e
  `/dashboard/billing` redesenhados: `StatCard`, link do cardápio com botão
  de copiar, thumbnail de produto sempre visível (placeholder quando não há
  foto), badge de status do pedido com cor própria por estado
- `QrCodeCard` (`src/components/dashboard/qr-code-card.tsx`), na Visão
  geral: gera o QR Code da URL pública do cardápio 100% no navegador (pacote
  `qrcode.react`, sem chamar nenhuma API de terceiros) e oferece "Baixar QR
  Code" em PNG (1024×1024, via `<canvas>`) ou SVG — pronto pra imprimir e
  colar nas mesas. A margem de 4 módulos (quiet zone mínima da spec do QR)
  vai embutida no arquivo baixado, mesmo a pré-visualização na tela já tendo
  espaço em branco ao redor por causa do card
- `/r/[slug]` (cardápio público) redesenhado mobile-first: hero do
  restaurante com badge de aberto/fechado, grid de produtos com foto grande,
  e um **botão flutuante de carrinho** (FAB, ancorado no canto inferior) que
  abre o checkout num `Sheet`
- `/r/[slug]/pedido/[orderId]` (acompanhamento do pedido) ganhou uma barra de
  progresso com os passos do pedido (recebido → em preparo → pronto →
  concluído)
- Login, cadastro, onboarding, preços e a landing continuam no tema claro —
  fora do escopo desta fase
- **Bug de tema em componentes com portal (corrigido):** `Dialog`, `Sheet`,
  `Select`, `DropdownMenu` e `AlertDialog` renderizam seu conteúdo via
  portal, que por padrão vai direto para `document.body` — fora de qualquer
  wrapper com a classe `dark`, o que fazia esses popups aparecerem com o
  tema claro mesmo dentro do painel/cardápio escuros. Corrigido com
  `DarkPortalRoot` (`src/components/theme/dark-portal-root.tsx`): a raiz
  escura de cada área (`DashboardShell` e as páginas de `/r/[slug]`) expõe,
  via contexto React, o próprio nó DOM como `container` do portal, mantendo
  o conteúdo dentro da árvore com tema escuro
- Toast (Sonner) não depende mais de `next-themes`/preferência do sistema
  operacional (não havia `ThemeProvider` no app) — `src/components/ui/
  sonner.tsx` decide claro/escuro pela rota atual (`/dashboard` e `/r/`
  são escuras; o resto é claro)
- **Bug de fonte serifada (corrigido):** em `globals.css`, o token
  `--font-sans` apontava para `var(--font-sans)` — uma referência circular
  a si mesma, já que a fonte Geist carregada em `layout.tsx` fica salva na
  variável `--font-geist-sans`, não `--font-sans`. Um valor CSS circular é
  inválido, então o navegador ignorava silenciosamente a fonte do projeto e
  caía na serifada padrão do sistema (ex.: Times New Roman) em **todo**
  título e texto do app — painel, cardápio público e o resto. Corrigido
  apontando `--font-sans` para `var(--font-geist-sans)`; como `--font-mono`
  e `--font-heading` (usado em `CardTitle`, `DialogTitle`, `SheetTitle`
  etc.) dependem desse mesmo token, a correção se propaga para toda a UI
  sem precisar editar componente por componente

**Fase 6 — rebrand para CardápioPontoCom e redesign premium da landing**

- **Rebrand completo:** todas as referências ao nome antigo ("MENÜA") foram
  substituídas por **CardápioPontoCom** — landing, header/footer, painel,
  cardápio público, login/cadastro, títulos de página (`<title>`), metatags,
  favicon, comentários no schema do Prisma e README. Nome, tagline e helper
  `pageTitle()` centralizados em `src/config/brand.ts` — qualquer texto de
  marca no app deveria importar daqui, não repetir a string
- **Identidade visual nova:** `src/components/brand/logo.tsx` define o
  símbolo (`LogoMark`, um "ponto de conexão" — anel + ponto, lembrando um
  marcador de QR Code — deliberadamente não um garfo/faca genérico), o
  wordmark (`LogoWordmark`, estilizado como "cardápio**.**com") e o lockup
  completo (`Logo`). Usa tokens semânticos de cor, então funciona tanto no
  tema claro (login/cadastro) quanto no escuro (painel, cardápio público,
  landing, `/pricing`). `src/app/icon.svg` (mesmo desenho do `LogoMark`) é
  servido automaticamente como favicon pela convenção de arquivo do App
  Router
- **Landing page redesenhada:**
  - Hero: mantém o headline explicando o produto (H1 + parágrafo), mas ganhou
    uma marca d'água gigante e quase invisível do símbolo atrás do texto e
    fragmentos de UI flutuando ao redor — `FloatingChip`
    (`src/components/landing/floating-chip.tsx`, nova) mostra pílulas com
    texto real ("Novo pedido", "Pedido confirmado", "R$ 89,90", "Mesa 12"),
    complementando o `FloatingIcon` (QR Code) já existente — dá sensação de
    produto "vivo" sem exagerar na quantidade de elementos
  - Seção "Como funciona na prática" (mockup celular + painel): trocou os
    emojis (🍔/🥤) por fotografia real de comida — ver "Fotografia dos
    mockups" abaixo — e o produto de exemplo virou o item mais completo do
    cardápio de demonstração (Picanha na Brasa), reaproveitando os mesmos
    "Mesa 12"/"Pedido #1048" do hero para dar consistência entre seções
  - Seção de benefícios: virou um bento grid assimétrico (1 card grande
    "Tudo em um só lugar", com uma mini-prévia do painel, cercado por 4 cards
    menores + 1 card largo) em vez de 6 cards idênticos — todos os cards
    usam `TiltCard` (já existente) para o efeito de profundidade 3D sutil
  - Nova seção de planos (`src/components/landing/pricing-section.tsx`) foi
    adicionada à landing (antes só existia em `/pricing`) — mesmos 2 planos
    reais do sistema (Starter/Pro, `src/config/plans.ts`), sem inventar
    nenhum plano free que não existe na cobrança
- **`/pricing` alinhado à landing:** a página passou a usar `LandingHeader` +
  `LandingFooter` (as mesmas usadas na landing) em vez do antigo
  `SiteHeader`/tema claro — mesma tipografia, cores, espaçamento e animações
  dos dois lugares. Os cards de plano viraram um componente compartilhado
  (`src/components/billing/pricing-cards.tsx`), usado tanto na landing quanto
  em `/pricing`, com badge "MAIS ESCOLHIDO" no plano recomendado. Como
  consequência, `SiteHeader` e `UserNav` (`src/components/layout/`) ficaram
  sem nenhum uso e foram removidos
- **Fotografia dos mockups:** `src/config/demo-images.ts` centraliza fotos
  reais de comida (CDN da Unsplash, licença livre) usadas nos mockups da
  landing e no cardápio de demonstração. O cardápio de demonstração
  (`/r/lanchonete-do-joao`, seed em `prisma/seed.ts`) foi ampliado de 1 para
  9 produtos reais com foto (Picanha, 3 hambúrgueres, batata frita, Coca-Cola,
  suco natural, brownie, cheesecake) para o botão "Ver Cardápio de
  Demonstração" realmente impressionar. `next.config.ts` ganhou
  `images.remotePatterns` para `images.unsplash.com`, e `ProductRow`/
  `MenuClient` passaram a pular a otimização do `next/image` só quando a
  imagem é upload do usuário (`data:` URL en base64 — ver Fase 4), deixando
  o Next otimizar (resize, AVIF/WebP) as fotos remotas normalmente
- **Validação:** `tsc --noEmit`, `eslint` e `next build` (produção) rodando
  limpos; conferido visualmente via Playwright em desktop e mobile (landing
  completa, `/pricing`, painel, cardápio de demonstração)

## Próximos passos sugeridos

- Trocar o banco de dev (SQLite) por Postgres antes de ir para produção
- Configurar as chaves reais do Stripe (ver "Configurar o Stripe" acima) e
  testar o fluxo de checkout de ponta a ponta
- Adicionar provedores OAuth (Google, GitHub) no Auth.js, se necessário
- Decidir e implementar as regras de acesso por plano (ex.: limitar nº de
  produtos ou pedidos/mês no plano Starter)
- Se o cardápio crescer muito (ou antes de deployar em serverless como a
  Vercel), trocar o storage de upload de imagens (`src/lib/uploads.ts`,
  hoje base64 no banco) por object storage, e o pub/sub de notificações
  (`src/lib/order-events.ts`) por um serviço real (ver Fase 4 acima)
