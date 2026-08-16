"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// Chip de ícone "flutuante" usado ao redor do hero — dá a sensação de
// profundidade/3D combinando: sombra colorida (glow), leve rotação fixa
// (perspectiva) e uma animação infinita e suave de subir/descer, cada
// ícone com seu próprio ritmo para não parecerem sincronizados.
export function FloatingIcon({
  icon: Icon,
  className,
  color = "orange",
  duration = 4,
  delay = 0,
  rotate = 0,
  size = "size-11",
}: {
  icon: LucideIcon;
  className?: string;
  color?: "orange" | "amber" | "rose" | "emerald";
  duration?: number;
  delay?: number;
  rotate?: number;
  size?: string;
}) {
  const colorMap: Record<string, string> = {
    orange: "from-orange-400/90 to-orange-600/90 shadow-orange-500/40",
    amber: "from-amber-300/90 to-amber-500/90 shadow-amber-400/40",
    rose: "from-rose-400/90 to-rose-600/90 shadow-rose-500/40",
    emerald: "from-emerald-400/90 to-emerald-600/90 shadow-emerald-500/40",
  };

  return (
    <motion.div
      className={cn("absolute select-none", className)}
      style={{ transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, y: 10, rotate: rotate - 6 }}
      animate={{
        opacity: 1,
        y: [0, -14, 0],
        rotate: [rotate - 3, rotate + 3, rotate - 3],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: { duration, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration: duration * 1.4, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br shadow-xl backdrop-blur-md",
          size,
          colorMap[color]
        )}
      >
        <Icon className="size-1/2 text-white drop-shadow-sm" strokeWidth={2.25} />
      </div>
    </motion.div>
  );
}
