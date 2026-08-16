// Fotografia real de comida usada nos mockups da landing page e no
// cardápio de demonstração — curada e verificada manualmente (assunto +
// enquadramento conferidos, não apenas o link funcionando) na Unsplash.
// Centralizado aqui para reaproveitar a mesma foto em vários componentes
// sem duplicar URLs/credit espalhados pelo código.
//
// Formato da URL: CDN direto da Unsplash (images.unsplash.com/photo-<id>),
// não o antigo atalho "source.unsplash.com" (descontinuado). `next/image`
// otimiza a partir daqui — ver `images.remotePatterns` em next.config.ts.

export type DemoImage = {
  id: string;
  url: string;
  alt: string;
};

function unsplash(id: string, alt: string): DemoImage {
  return {
    id,
    url: `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=800`,
    alt,
  };
}

export const DEMO_IMAGES = {
  picanha: unsplash(
    "photo-1558030006-450675393462",
    "Picanha grelhada fatiada, com crosta escura característica do preparo na brasa"
  ),
  hamburguerClassico: unsplash(
    "photo-1568901346375-23c9450c58cd",
    "Hambúrguer artesanal suculento com queijo derretido, alface e tomate"
  ),
  hamburguerBacon: unsplash(
    "photo-1550547660-d9450f859349",
    "Hambúrgueres artesanais rústicos servidos com garrafas de refrigerante"
  ),
  hamburguerSmash: unsplash(
    "photo-1551782450-a2132b4ba21d",
    "Combo de hambúrguer smash com batata frita"
  ),
  batataFrita: unsplash(
    "photo-1573080496219-bb080dd4f877",
    "Porção de batata frita crocante e dourada"
  ),
  pizza: unsplash(
    "photo-1565299624946-b28f40a0ae38",
    "Pizza artesanal recém-saída do forno"
  ),
  brownie: unsplash(
    "photo-1606313564200-e75d5e30476c",
    "Brownie de chocolate com calda, apresentação premium"
  ),
  cheesecake: unsplash(
    "photo-1524351199678-941a58a3df50",
    "Fatia de cheesecake com calda de frutas vermelhas"
  ),
  refrigerante: unsplash(
    "photo-1554866585-cd94860890b7",
    "Lata de refrigerante gelada, coberta de gotas de condensação"
  ),
  sucoNatural: unsplash(
    "photo-1600271886742-f049cd451bba",
    "Copo de suco natural de laranja"
  ),
} as const;
