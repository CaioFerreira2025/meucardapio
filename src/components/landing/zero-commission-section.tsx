"use client";

import { useState } from "react";
import { AtSign, MessageCircle, PiggyBank, QrCode } from "lucide-react";

import { Reveal } from "@/components/landing/reveal";
import { getCheapestMonthlyEquivalentCents } from "@/config/plans";
import { formatCents } from "@/lib/currency";

// Seção "0% de comissão" — o argumento principal para o lojista que hoje
// vende por aplicativo de delivery e sente a mordida da comissão.
//
// Por que uma calculadora, e não uma frase:
//
// "Economize com comissões" é abstrato e todo concorrente diz isso. O que
// convence é o lojista ver o PRÓPRIO número. Ele já sabe quanto fatura e
// quanto paga de comissão — os controles partem de valores plausíveis e ele
// ajusta em dois segundos. O resultado deixa de ser promessa de marketing e
// vira uma conta que ele mesmo fez.
//
// Decisão deliberada: NENHUM concorrente é citado pelo nome, e não afirmamos
// qual taxa ninguém cobra — quem informa a porcentagem é o próprio lojista.
// Além de ser mais honesto, é mais persuasivo: o número que ele digita é o
// número real dele, não uma média que ele poderia contestar.

const MIN_REVENUE = 2000;
const MAX_REVENUE = 50000;
const MIN_FEE = 5;
const MAX_FEE = 30;

export function ZeroCommissionSection() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(15000);
  const [feePercent, setFeePercent] = useState(20);

  const commissionCents = Math.round(monthlyRevenue * 100 * (feePercent / 100));
  const ourPriceCents = getCheapestMonthlyEquivalentCents();
  const savedPerMonthCents = Math.max(0, commissionCents - ourPriceCents);
  const savedPerYearCents = savedPerMonthCents * 12;

  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="light-spot absolute inset-0" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-300 uppercase ring-1 ring-brand-500/25">
              Delivery próprio
            </span>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Venda direto pelo WhatsApp e pague{" "}
              <span className="bg-gradient-to-r from-brand-300 to-brand-200 bg-clip-text text-transparent">
                0% de comissão
              </span>
            </h2>
            <p className="max-w-2xl text-lg text-zinc-400">
              Seu cardápio vira um link. Você manda no grupo do WhatsApp, coloca
              na bio do Instagram, imprime o QR Code — ou tudo isso junto. O
              pedido cai direto no seu painel e o dinheiro é 100% seu.
            </p>
          </div>
        </Reveal>

        {/* Canais de venda — responde de imediato à objeção "mas eu não uso
            QR Code": o QR aparece como uma opção entre três, não como o
            caminho obrigatório. */}
        <Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                title: "No WhatsApp",
                body: "Mande o link no grupo, no status ou na conversa. O cliente pede sem instalar nada.",
              },
              {
                icon: AtSign,
                title: "No Instagram",
                body: "Coloque o link na bio ou nos stories e transforme seguidor em pedido.",
              },
              {
                icon: QrCode,
                title: "Na mesa (opcional)",
                body: "Se quiser atender no salão, o mesmo cardápio vira QR Code para as mesas.",
              },
            ].map((channel) => (
              <div
                key={channel.title}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/30">
                  <channel.icon className="size-4 text-brand-300" />
                </span>
                <p className="font-medium text-white">{channel.title}</p>
                <p className="text-sm leading-relaxed text-zinc-400">{channel.body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Calculadora */}
        <Reveal>
          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex flex-1 flex-col gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Faça a conta com os seus números
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Ajuste abaixo quanto você fatura por aplicativo hoje e qual
                    a comissão que pagam sobre cada pedido.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="revenue" className="text-sm text-zinc-300">
                      Faturamento mensal em delivery
                    </label>
                    <span
                      data-slot="calc-revenue"
                      className="text-lg font-semibold text-white"
                    >
                      {formatCents(monthlyRevenue * 100)}
                    </span>
                  </div>
                  <input
                    id="revenue"
                    type="range"
                    min={MIN_REVENUE}
                    max={MAX_REVENUE}
                    step={500}
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-400"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="fee" className="text-sm text-zinc-300">
                      Comissão cobrada por pedido
                    </label>
                    <span
                      data-slot="calc-fee"
                      className="text-lg font-semibold text-white"
                    >
                      {feePercent}%
                    </span>
                  </div>
                  <input
                    id="fee"
                    type="range"
                    min={MIN_FEE}
                    max={MAX_FEE}
                    step={1}
                    value={feePercent}
                    onChange={(e) => setFeePercent(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-400"
                  />
                </div>
              </div>

              {/* Resultado */}
              <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-brand-500/25 bg-brand-500/[0.06] p-6">
                <div>
                  <p className="text-sm text-zinc-400">
                    Você deixa de faturar em comissão, por mês
                  </p>
                  <p
                    data-slot="calc-commission"
                    className="text-3xl font-semibold tracking-tight text-rose-300 line-through decoration-rose-400/40"
                  >
                    {formatCents(commissionCents)}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm text-zinc-400">
                    Aqui você paga, por mês, a partir de
                  </p>
                  <p className="text-3xl font-semibold tracking-tight text-white">
                    {formatCents(ourPriceCents)}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Sem taxa por pedido. Quantos pedidos você fizer.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-brand-500/10 p-3.5 ring-1 ring-brand-500/25">
                  <PiggyBank className="mt-0.5 size-4 shrink-0 text-brand-300" />
                  <p className="text-sm text-brand-100">
                    Sobram{" "}
                    <span
                      data-slot="calc-saved-year"
                      className="font-semibold text-brand-200"
                    >
                      {formatCents(savedPerYearCents)}
                    </span>{" "}
                    no seu caixa em 12 meses.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500">
              Simulação com os valores que você informou acima, apenas para
              comparação. Não inclui taxas de meio de pagamento, que variam
              conforme a forma de recebimento que você escolher.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
