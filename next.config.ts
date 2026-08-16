import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotografia real de comida (mockups da landing + cardápio de
    // demonstração) é servida direto do CDN da Unsplash — habilita o
    // next/image a otimizar (resize, AVIF/WebP, lazy-load) esses domínios.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
