"use client";

import {
  Bell,
  ImageIcon,
  QrCode,
  RefreshCcw,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal";
import { TiltCard } from "@/components/landing/tilt-card";
import { cn } from "@/lib/utils";

const SMALL_FEATURES: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  color: "orange" | "amber" | "rose" | "emerald" | "sky" | "violet";
}> = [
  {
    icon: QrCode,
    title: "QR Code na mesa",
    description:
      "Cada restaurante tem sua própria URL pública. Gere o QR Code, cole na mesa e o cliente pede direto pelo celular dele.",
    color: "amber",
  },
  {
    icon: Bell,
    title: "Notificações instantâneas",
    description:
      "Assim que um pedido cai no cardápio, ele aparece no seu painel na hora — sem atualizar a página.",
    color: "orange",
  },
  {
    icon: ImageIcon,
    title: "Fotos dos produtos",
    description:
      "Capriche no cardápio com foto de cada item. Cardápio visual vende mais do que uma lista de nomes.",
    color: "violet",
  },
  {
    icon: RefreshCcw,
    title: "Sempre atualizado",
    description:
      "Mudou o preço ou acabou um item? Atualize no painel e o cardápio público reflete na hora.",
    color: "sky",
  },
];

const COLOR_MAP: Record<string, string> = {
  orange: "from-orange-400/20 to-orange-600/20 text-orange-300 ring-orange-500/30",
  amber: "from-amber-300/20 to-amber-500/20 text-amber-300 ring-amber-400/30",
  rose: "from-rose-400/20 to-rose-600/20 text-rose-300 ring-rose-500/30",
  emerald:
    "from-emerald-400/20 to-emerald-600/20 text-emerald-300 ring-emerald-500/30",
  sky: "from-sky-400/20 to-sky-600/20 text-sky-300 ring-sky-500/30",
  violet:
    "from-violet-400/20 to-violet-600/20 text-violet-300 ring-violet-500/30",
};

const MINI_STATS = [
  { label: "Categorias", value: "5" },
  { label: "Produtos", value: "18" },
  { label: "Pedidos hoje", value: "27" },
];

export function FeaturesSection() {
  return (
    <section className="relative bg-background py-24 sm:py-32">
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="text-sm font-semibold tracking-wide text-orange-400 uppercase">
            Tudo o que você precisa
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Feito para o dia a dia de quem vende comida
          </h2>
          <p className="text-lg text-zinc-400">
            Sem funcionalidade sobrando, sem curva de aprendizado. Só o que
            realmente ajuda a vender mais e perder menos pedido.
          </p>
        </Reveal>

        {/* Bento assimétrico: um card maior ("Tudo em um só lugar") com uma
            prévia do painel, cercado por cards menores — nem todo recurso
            precisa do mesmo destaque visual. */}
        <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[190px]">
          <RevealItem className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <TiltCard maxTilt={4} className="group relative h-full">
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-7 backdrop-blur-sm transition-colors hover:border-white/20">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-orange-500/10 blur-[80px]"
                />
                <div className="relative">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400/20 to-rose-500/20 ring-1 ring-orange-500/30">
                    <Smartphone className="size-5 text-orange-300" strokeWidth={2} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    Tudo em um só lugar
                  </h3>
                  <p className="max-w-sm text-sm text-zinc-400">
                    Cadastre categorias e produtos, marque o que está em
                    falta e acompanhe todos os pedidos — recebido, em
                    preparo, pronto — num único painel, sem planilha e sem
                    perder pedido.
                  </p>
                </div>

                {/* mini-prévia do painel */}
                <div className="relative mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-background/60 p-3">
                  {MINI_STATS.map((stat) => (
                    <div key={stat.label} className="flex-1 text-center">
                      <p className="text-lg font-semibold text-white">
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-zinc-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </RevealItem>

          {SMALL_FEATURES.map((feature) => (
            <RevealItem key={feature.title}>
              <TiltCard maxTilt={6} className="group relative h-full">
                <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.05]">
                  <div
                    className={cn(
                      "mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
                      COLOR_MAP[feature.color]
                    )}
                  >
                    <feature.icon className="size-5" strokeWidth={2} />
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </div>
              </TiltCard>
            </RevealItem>
          ))}

          <RevealItem className="sm:col-span-2 lg:col-span-4">
            <div className="flex h-full flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.05] sm:flex-row sm:items-center">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 ring-1 ring-emerald-500/30">
                <Smartphone className="size-5 text-emerald-300" strokeWidth={2} />
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-white">
                  Funciona em qualquer tela
                </h3>
                <p className="text-sm text-zinc-400">
                  Painel e cardápio público são 100% responsivos — do
                  celular do cliente ao computador do balcão, a experiência
                  é sempre ótima.
                </p>
              </div>
            </div>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}
