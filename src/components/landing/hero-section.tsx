"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  PlusCircle,
  QrCode,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FloatingIcon } from "@/components/landing/floating-icon";
import { FloatingChip } from "@/components/landing/floating-chip";
import { LogoMark } from "@/components/brand/logo";
import { BRAND_NAME, DEMO_RESTAURANT_SLUG } from "@/config/brand";

const TRUST_ITEMS = [
  "Configura em minutos",
  "Sem app pra instalar",
  "Funciona em qualquer celular",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-28 pb-32 sm:pt-36 sm:pb-44">
      {/* fundo: brilhos radiais em degradê, dão profundidade sem pesar */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-orange-600/20 blur-[120px]" />
        <div className="absolute top-1/3 right-[8%] h-72 w-72 rounded-full bg-rose-600/15 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[10%] h-80 w-80 rounded-full bg-amber-500/15 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(10,10,10)_75%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,black,transparent)]" />
      </div>

      {/* marca d'água: símbolo gigante e quase invisível atrás do headline —
          reforça a marca sem competir com o texto (que precisa continuar
          sendo o que explica o produto). */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05]"
      >
        <LogoMark className="size-[38rem]" />
      </div>

      {/* fragmentos de UI do produto flutuando ao redor do headline — QR
          Code, notificações e pedidos "vivos", só em telas médias+ e com
          bastante moderação (poucos elementos, movimento bem sutil). */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <FloatingIcon
          icon={QrCode}
          color="amber"
          className="top-[16%] left-[11%]"
          duration={4.5}
          rotate={-8}
        />
        <FloatingChip
          icon={Bell}
          label="Novo pedido"
          tone="accent"
          className="top-[13%] right-[10%]"
          duration={5}
          delay={0.3}
          rotate={6}
        />
        <FloatingChip
          icon={CheckCircle2}
          label="Pedido confirmado"
          tone="success"
          className="bottom-[26%] right-[6%]"
          duration={4.2}
          delay={0.6}
          rotate={-5}
        />
        <FloatingChip
          icon={PlusCircle}
          label="Produto adicionado"
          tone="neutral"
          className="bottom-[16%] left-[5%]"
          duration={4.8}
          delay={0.2}
          rotate={5}
        />
        <FloatingChip
          label="R$ 89,90"
          tone="accent"
          className="top-[44%] left-[2%]"
          duration={5.4}
          delay={0.5}
          rotate={-4}
        />
        <FloatingChip
          label="Mesa 12"
          tone="neutral"
          className="top-[48%] right-[1%]"
          duration={4.6}
          delay={0.8}
          rotate={4}
        />
      </div>

      {/* O headline/CTA nunca pode depender de JS ter rodado para ficar
          visível — por isso a entrada abaixo anima só `y` (desliza de
          baixo pra cima), nunca `opacity`. Se o framer-motion demorar pra
          hidratar (rede/CPU fraca no celular) ou a animação não disparar
          por algum motivo, o conteúdo já está com opacidade 1 por padrão e
          continua legível, só sem o leve deslize — nunca fica invisível. */}
      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-7 px-4 text-center sm:px-6">
        <motion.div
          initial={{ y: -10 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-orange-200 backdrop-blur-md"
        >
          <Sparkles className="size-3.5 text-orange-300" />
          Feito para restaurantes, lanchonetes e hamburguerias
        </motion.div>

        <motion.h1
          initial={{ y: 18 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl leading-[1.08] font-semibold tracking-tight text-white sm:text-6xl"
        >
          Aumente suas vendas com o{" "}
          <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 bg-clip-text text-transparent">
            cardápio digital
          </span>{" "}
          mais rápido e moderno
        </motion.h1>

        <motion.p
          initial={{ y: 18 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl text-lg text-zinc-400 sm:text-xl"
        >
          O {BRAND_NAME} é o cardápio digital e sistema de pedidos do seu
          jeito: seus clientes escaneiam o QR Code, montam o pedido e você
          acompanha tudo em tempo real — sem planilha, sem WhatsApp
          bagunçado, sem esperar.
        </motion.p>

        <motion.div
          initial={{ y: 18 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-2 flex flex-col gap-3 sm:flex-row"
        >
          <Button
            size="lg"
            className="h-12 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 text-base font-semibold text-white shadow-lg shadow-orange-600/30 hover:from-orange-400 hover:to-rose-400 hover:shadow-orange-500/40"
            render={
              <Link href="/register">
                Criar Conta Grátis
                <ArrowRight className="size-4" />
              </Link>
            }
          />
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-xl border-white/20 bg-white/5 px-6 text-base text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
            render={
              <Link href={`/r/${DEMO_RESTAURANT_SLUG}`} target="_blank" rel="noreferrer">
                Ver Cardápio de Demonstração
              </Link>
            }
          />
        </motion.div>

        <motion.ul
          initial={{ y: 10 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500"
        >
          {TRUST_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-orange-500" />
              {item}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
