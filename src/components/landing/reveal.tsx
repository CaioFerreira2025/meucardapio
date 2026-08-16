"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// Só anima `y` (nunca `opacity`) — o conteúdo já nasce com opacidade 1.
// Se o IntersectionObserver do `whileInView` não disparar por qualquer
// motivo (JS lento pra hidratar, navegador com proteções agressivas de
// privacidade, etc.), o pior cenário é o elemento ficar parado alguns
// pixels abaixo da posição final — nunca invisível. Ver mesmo raciocínio
// em hero-section.tsx.
const variants: Variants = {
  hidden: { y: 28 },
  show: {
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

// Faz o conteúdo "entrar" suavemente quando o usuário rola até ele —
// usado em todas as seções da landing page. `once: true` evita que a
// animação repita toda vez que o elemento entra/sai da viewport.
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "span";
}) {
  const MotionTag = as === "span" ? motion.span : motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}

// Anima os filhos em sequência (stagger) conforme entram na tela — usado
// em grids de cards (funcionalidades, passos).
export function RevealGroup({
  children,
  className,
  stagger = 0.1,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ staggerChildren: stagger }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}
