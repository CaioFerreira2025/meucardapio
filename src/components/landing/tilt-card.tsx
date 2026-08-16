"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { ReactNode } from "react";

// Efeito de profundidade "3D": o card inclina sutilmente seguindo o
// cursor do mouse (rotateX/rotateY), com uma leve mudança de brilho —
// simula um objeto físico sem precisar de WebGL/three.js, o que mantém a
// página leve e rápida em qualquer dispositivo. Em telas sem mouse
// (celular) o card simplesmente fica parado no estado neutro.
export function TiltCard({
  children,
  className,
  maxTilt = 8,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  const rotateX = useSpring(
    useTransform(y, [0, 1], [maxTilt, -maxTilt]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(x, [0, 1], [-maxTilt, maxTilt]),
    springConfig
  );
  const glowX = useSpring(useTransform(x, [0, 1], [0, 100]), springConfig);
  const glowY = useSpring(useTransform(y, [0, 1], [0, 100]), springConfig);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width);
    y.set((event.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1200,
      }}
      className={className}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([gx, gy]) =>
              `radial-gradient(circle at ${gx}% ${gy}%, oklch(0.75 0.18 55 / 0.18), transparent 60%)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}
