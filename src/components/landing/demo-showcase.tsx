"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Bell, Minus, Plus, Signal, Wifi } from "lucide-react";

import { Reveal } from "@/components/landing/reveal";
import { TiltCard } from "@/components/landing/tilt-card";
import { DEMO_IMAGES } from "@/config/demo-images";
import { cn } from "@/lib/utils";

export function DemoShowcase() {
  return (
    <section className="relative bg-background py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="text-sm font-semibold tracking-wide text-orange-400 uppercase">
            Como funciona na prática
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Seu cliente pede pelo celular. Você recebe na hora.
          </h2>
          <p className="text-lg text-zinc-400">
            O mesmo cardápio que você vai usar de verdade — sem mockup
            genérico. É exatamente essa experiência que seus clientes vão
            ver e que vai aparecer no seu painel.
          </p>
        </Reveal>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          {/* mockup 1: cardápio público no celular */}
          <Reveal className="mx-auto w-full max-w-xs">
            <TiltCard className="group relative" maxTilt={6}>
              <div className="relative rounded-[2.5rem] border border-white/10 bg-zinc-900 p-3 shadow-2xl shadow-black/50">
                <div className="overflow-hidden rounded-[2rem] bg-zinc-50">
                  {/* status bar */}
                  <div className="flex items-center justify-between px-5 pt-3 text-[11px] font-medium text-zinc-500">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <Signal className="size-3" />
                      <Wifi className="size-3" />
                    </div>
                  </div>

                  <div className="px-5 pt-4 pb-24">
                    <p className="text-lg font-semibold text-zinc-900">
                      Lanchonete do João
                    </p>
                    <p className="text-xs text-zinc-500">
                      Lanches, porções e bebidas.
                    </p>

                    <p className="mt-5 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                      Carnes
                    </p>

                    <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                      <div className="flex gap-3 p-3">
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                          <Image
                            src={DEMO_IMAGES.picanha.url}
                            alt={DEMO_IMAGES.picanha.alt}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-zinc-900">
                            Picanha na Brasa
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Picanha premium grelhada no ponto, com farofa
                            artesanal e vinagrete
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-zinc-900">
                              R$ 59,90
                            </span>
                            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-1.5 py-1">
                              <Minus className="size-3 text-zinc-500" />
                              <span className="w-3 text-center text-xs font-medium text-zinc-700">
                                1
                              </span>
                              <Plus className="size-3 text-zinc-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                      Bebidas
                    </p>

                    <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white opacity-70 shadow-sm">
                      <div className="flex gap-3 p-3">
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                          <Image
                            src={DEMO_IMAGES.refrigerante.url}
                            alt={DEMO_IMAGES.refrigerante.alt}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-zinc-900">
                            Refrigerante lata
                          </p>
                          <p className="text-[11px] text-zinc-500">350ml</p>
                          <p className="mt-2 text-sm font-semibold text-zinc-900">
                            R$ 6,00
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* barra de carrinho flutuante */}
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-2xl bg-zinc-900 px-4 py-3 shadow-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <span className="flex size-5 items-center justify-center rounded-full bg-orange-500 text-[11px]">
                        1
                      </span>
                      R$ 59,90
                    </div>
                    <span className="text-sm font-semibold text-orange-400">
                      Ver carrinho
                    </span>
                  </div>
                </div>
              </div>
            </TiltCard>
          </Reveal>

          {/* conector entre os dois mockups */}
          <Reveal
            delay={0.15}
            className="mx-auto hidden flex-col items-center gap-2 lg:flex"
          >
            <ConnectorPulse />
            <span className="max-w-[7rem] text-center text-xs text-zinc-500">
              chega no painel em tempo real
            </span>
          </Reveal>

          {/* mockup 2: painel de pedidos em tempo real */}
          <Reveal delay={0.1} className="mx-auto w-full max-w-md">
            <TiltCard className="group relative" maxTilt={5}>
              <div className="relative rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-3">
                  <span className="size-2.5 rounded-full bg-red-500/70" />
                  <span className="size-2.5 rounded-full bg-amber-500/70" />
                  <span className="size-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 rounded-md bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-400">
                    cardapiopontocom.com/dashboard/pedidos
                  </span>
                </div>

                <div className="relative overflow-hidden rounded-b-2xl bg-zinc-50 px-4 pt-4 pb-5">
                  <p className="text-sm font-semibold text-zinc-900">
                    Pedidos
                  </p>
                  <p className="text-[11px] text-zinc-500">Em aberto (2)</p>

                  <div className="mt-3 space-y-2.5">
                    <OrderRow
                      name="Pedido #1048"
                      meta="Mesa 12 · agora"
                      item="1x Picanha na Brasa"
                      total="R$ 59,90"
                      status="Recebido"
                      statusClass="bg-zinc-200 text-zinc-700"
                    />
                    <OrderRow
                      name="Maria Cliente"
                      meta="Mesa 5 · 2 min"
                      item="2x Picanha na Brasa"
                      total="R$ 119,80"
                      status="Em preparo"
                      statusClass="bg-orange-100 text-orange-700"
                    />
                  </div>

                  {/* toast simulando a notificação em tempo real (SSE) */}
                  <motion.div
                    className="absolute top-3 right-3 flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 shadow-lg"
                    initial={{ opacity: 0, y: -12, scale: 0.95 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: [-12, 0, 0, -8],
                      scale: [0.95, 1, 1, 0.98],
                    }}
                    transition={{
                      duration: 3.2,
                      times: [0, 0.15, 0.8, 1],
                      repeat: Infinity,
                      repeatDelay: 1.4,
                      ease: "easeInOut",
                    }}
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-orange-500">
                      <Bell className="size-3.5 text-white" />
                    </span>
                    <span className="text-xs font-medium text-zinc-800">
                      Novo pedido recebido!
                    </span>
                  </motion.div>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function OrderRow({
  name,
  meta,
  item,
  total,
  status,
  statusClass,
}: {
  name: string;
  meta: string;
  item: string;
  total: string;
  status: string;
  statusClass: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-zinc-900">{name}</p>
          <p className="text-[10px] text-zinc-500">{meta}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            statusClass
          )}
        >
          {status}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-600">
        <span>{item}</span>
        <span className="font-semibold text-zinc-900">{total}</span>
      </div>
    </div>
  );
}

function ConnectorPulse() {
  return (
    <div className="relative flex h-24 w-16 items-center justify-center">
      <svg
        viewBox="0 0 64 96"
        className="h-full w-full text-zinc-700"
        fill="none"
      >
        <path
          d="M4 4C4 40 60 56 60 92"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
      </svg>
      {/* pulso animado nas duas pontas, dando a sensação de dado "viajando"
          do celular para o painel sem depender de motion-path (suporte
          irregular entre navegadores) */}
      <motion.span
        className="absolute top-2 left-2.5 size-2 rounded-full bg-orange-400 shadow-[0_0_10px_2px_rgba(251,146,60,0.7)]"
        animate={{ opacity: [1, 0.2, 1], scale: [1, 0.8, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute bottom-2 right-2 size-2 rounded-full bg-orange-400 shadow-[0_0_10px_2px_rgba(251,146,60,0.7)]"
        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
