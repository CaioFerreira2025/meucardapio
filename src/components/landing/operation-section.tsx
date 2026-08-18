import { ArrowRight, ClipboardList, Wallet } from "lucide-react";

import { Reveal } from "@/components/landing/reveal";

// Seção "sai o papel, entra o painel".
//
// O público-alvo aqui não é quem quer tecnologia — é quem já perdeu pedido
// por causa de comanda rasurada e já fechou o dia sem saber se o caixa
// bateu. Por isso a estrutura de cada bloco é DOR → o que muda, e não uma
// lista de funcionalidades: "Central de Pedidos com kanban" não diz nada
// para ele; "o pedido não some no meio do movimento" diz.
//
// O contraste "antes / agora" existe porque essa pessoa não está comparando
// nosso sistema com outro sistema — ela está comparando com o caderno que
// usa hoje. É contra o caderno que precisamos ganhar.

const BLOCKS = [
  {
    icon: ClipboardList,
    eyebrow: "Central de Pedidos",
    title: "Nenhum pedido se perde no meio do movimento",
    before: "Comanda no papel, letra apagada, pedido esquecido embaixo do balcão.",
    after:
      "Todo pedido entra numa fila visível: Recebido, Em preparo, Pronto, Entregue. Um toque avança a etapa, e a cozinha e o salão veem a mesma tela.",
    bullets: [
      "O cliente acompanha pelo celular e para de perguntar se já saiu",
      "Pedido do salão, do WhatsApp e do delivery no mesmo lugar",
      "Histórico salvo — dá para conferir qualquer pedido depois",
    ],
  },
  {
    icon: Wallet,
    eyebrow: "Controle de Caixa",
    title: "No fim do dia, você sabe se bateu",
    before: "Conferir a gaveta de cabeça, somar notas no papel e torcer para fechar.",
    after:
      "Você informa o troco na abertura, as vendas em dinheiro entram sozinhas, e no fechamento o sistema mostra na hora se sobrou ou faltou.",
    bullets: [
      "Faturamento do dia calculado sem você somar nada",
      "Diferença de caixa apontada na hora, não no fim do mês",
      "Vendas em Pix, cartão e dinheiro separadas automaticamente",
    ],
  },
];

export function OperationSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="light-spot absolute inset-0" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-300 uppercase ring-1 ring-brand-500/20">
              Organização do dia a dia
            </span>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Sai o caderno, entra o controle
            </h2>
            <p className="max-w-2xl text-lg text-zinc-400">
              Você não precisa entender de tecnologia para usar. Se você sabe
              usar o WhatsApp, sabe usar isto aqui.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 flex flex-col gap-6">
          {BLOCKS.map((block) => (
            <Reveal key={block.eyebrow}>
              <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
                <div className="flex flex-col gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400/20 to-brand-500/20 ring-1 ring-brand-500/25">
                    <block.icon className="size-5 text-brand-300" />
                  </span>
                  <p className="text-xs font-semibold tracking-wide text-brand-300 uppercase">
                    {block.eyebrow}
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {block.title}
                  </h3>
                  <p className="text-zinc-400">{block.after}</p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* O "antes" fica visualmente apagado e riscado — a leitura
                      de "isso ficou para trás" acontece antes de ler o texto. */}
                  <div className="flex items-start gap-2.5 rounded-xl bg-black/20 p-3.5 ring-1 ring-white/5">
                    <span className="mt-0.5 shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                      Antes
                    </span>
                    <p className="text-sm text-zinc-500 line-through decoration-zinc-600">
                      {block.before}
                    </p>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {block.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-sm text-zinc-300">
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-brand-300" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
