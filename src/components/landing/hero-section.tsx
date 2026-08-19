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
    <section className="texture-grain relative overflow-hidden bg-background pt-28 pb-32 sm:pt-36 sm:pb-44">
      {/* FUNDO — iluminação de estúdio, não manchas de cor nem formas com
          borda perceptível.

          Duas tentativas anteriores erraram do mesmo jeito: qualquer camada
          com um limite definido — um círculo com blur, ou (como aqui até a
          versão anterior) uma malha de linhas recortada por
          `mask-image: radial-gradient(...)` — em telas de celular curtas
          fica "espremida" perto do headline, e o olho enxerga o contorno da
          máscara como um retângulo/quadrado atrás do texto, mesmo a cor de
          dentro sendo bem sutil. No computador, com mais altura de sobra ao
          redor, o mesmo contorno fica longe o bastante do texto pra passar
          despercebido — por isso o problema só aparecia no celular.

          A correção: nenhuma camada de fundo aqui tem borda lateral ou
          inferior. `.light-spot` agora é um facho vertical (topo →
          transparente) que cobre 100% da largura — sem elipse, sem máscara,
          então não existe contorno nenhum pra virar "quadrado", em
          qualquer altura de tela. A vinheta fecha só as bordas externas da
          seção, longe do headline. Grão de filme por cima quebra o
          degradê. */}
      <div aria-hidden className="light-spot pointer-events-none absolute inset-0" />
      <div aria-hidden className="vignette pointer-events-none absolute inset-0" />

      {/* Marca d'água: o lobo da GreyPack, gigante e quase invisível atrás
          do headline. `hidden lg:block` — no celular ela ATRAPALHAVA em vez
          de decorar: a 38rem numa tela de 390px, a ilustração fica maior
          que a largura do aparelho e o que sobra atrás do texto é um
          recorte irreconhecível. Marca d'água só funciona quando cabe
          inteira, o que a partir de `lg` acontece.

          `sizes="608px"` é o ÚNICO lugar do site onde o LogoMark não usa o
          padrão de 128px do componente (ver logo.tsx) — aqui ele realmente
          é exibido a 38rem (608px), então precisa pedir a imagem nesse
          tamanho, senão o navegador busca a versão pequena de ícone e
          estica ela pra caber no espaço gigante, o que serrilha. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 opacity-[0.04] lg:block"
      >
        <LogoMark className="size-[38rem]" sizes="608px" />
      </div>

      {/* fragmentos de UI do produto flutuando ao redor do headline — QR
          Code, notificações e pedidos "vivos", só em telas médias+ e com
          bastante moderação (poucos elementos, movimento bem sutil). */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <FloatingIcon
          icon={QrCode}
          color="brand"
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
          className="inline-flex items-center gap-2 rounded-full border border-brand-300/25 bg-brand-500/10 px-4 py-1.5 text-[11px] font-medium tracking-[0.14em] text-brand-200 uppercase backdrop-blur-md"
        >
          <Sparkles className="size-3.5 text-brand-300" />
          Feito para restaurantes, lanchonetes e hamburguerias
        </motion.div>

        <motion.h1
          initial={{ y: 18 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl leading-[1.08] font-semibold tracking-tight text-white sm:text-6xl"
        >
          Aumente suas vendas com o{" "}
          <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-brand-400 bg-clip-text text-transparent">
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
          Com o {BRAND_NAME} seu cardápio vira um link para vender direto no
          WhatsApp e no Instagram — <strong className="font-semibold text-zinc-200">
          sem pagar comissão por pedido</strong>. Os pedidos caem organizados no
          seu painel, e o QR Code na mesa fica disponível se você também
          atende no salão.
        </motion.p>

        <motion.div
          initial={{ y: 18 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-2 flex flex-col gap-3 sm:flex-row"
        >
          <Button
            size="lg"
            className="h-12 gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-base font-semibold text-white shadow-lg shadow-brand-900/50 ring-1 ring-brand-300/20 hover:from-brand-500 hover:to-brand-400 hover:shadow-brand-700/50"
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
              <span className="size-1.5 rounded-full bg-brand-400" />
              {item}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
