import type { NextConfig } from "next";

// O `next dev` bloqueia com 403 os arquivos estáticos (_next/static/*)
// quando acessados por um host diferente de "localhost" — é uma proteção
// padrão do Next.js contra requisições cross-site no servidor de
// desenvolvimento. Isso quebra o cardápio público quando aberto pelo QR
// Code no celular: o celular acessa pelo IP da rede local (ex.:
// 192.168.0.x), não por "localhost", então CSS/JS falham ao carregar e a
// página fica preta/sem estilo — mesmo a página em si carregando normal.
//
// Aqui liberamos automaticamente o host configurado em
// NEXT_PUBLIC_APP_URL (a mesma URL usada para montar o link/QR Code do
// cardápio) e, quando é um IP local, a sub-rede inteira (ex.:
// 192.168.0.*), para o QR Code continuar funcionando mesmo se o IP mudar
// por DHCP. Não afeta produção — allowedDevOrigins só tem efeito em
// `next dev`.
function allowedDevOriginsFromAppUrl(): string[] {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return [];

  try {
    const { hostname } = new URL(raw);
    const ipv4Match = hostname.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
    if (ipv4Match) {
      return [hostname, `${ipv4Match[1]}.*`];
    }
    return [hostname];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedDevOriginsFromAppUrl(),
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
