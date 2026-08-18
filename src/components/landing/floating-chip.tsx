"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// Variante "de dados" do FloatingIcon: em vez de um ícone isolado, mostra
// um pequeno cartão/pílula com texto real (ex: "Mesa 12", "R$ 89,90"),
// simulando fragmentos de UI do produto flutuando ao redor do hero — dá a
// sensação de "produto vivo" sem precisar de uma ilustração 3D customizada.
// Mesmo tratamento de flutuação suave e assíncrona do FloatingIcon, para
// os dois tipos de chip se misturarem no mesmo espaço sem parecer duplicado.
export function FloatingChip({
  icon: Icon,
  label,
  tone = "neutral",
  className,
  duration = 4.5,
  delay = 0,
  rotate = 0,
}: {
  icon?: LucideIcon;
  label: string;
  tone?: "neutral" | "success" | "accent";
  className?: string;
  duration?: number;
  delay?: number;
  rotate?: number;
}) {
  const toneMap: Record<string, string> = {
    neutral: "text-zinc-200",
    success: "text-emerald-300",
    accent: "text-brand-300",
  };

  const dotMap: Record<string, string> = {
    neutral: "bg-zinc-400",
    success: "bg-emerald-400",
    accent: "bg-brand-400",
  };

  return (
    <motion.div
      className={cn("absolute select-none", className)}
      initial={{ opacity: 0, y: 10, rotate: rotate - 4 }}
      animate={{
        opacity: 1,
        y: [0, -12, 0],
        rotate: [rotate - 2, rotate + 2, rotate - 2],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: { duration, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration: duration * 1.4, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 py-1.5 pr-3 pl-2 shadow-lg shadow-black/30 backdrop-blur-md">
        {Icon ? (
          <Icon className={cn("size-3.5", toneMap[tone])} strokeWidth={2.25} />
        ) : (
          <span className={cn("size-1.5 rounded-full", dotMap[tone])} />
        )}
        <span className={cn("text-xs font-medium whitespace-nowrap", toneMap[tone])}>
          {label}
        </span>
      </div>
    </motion.div>
  );
}
