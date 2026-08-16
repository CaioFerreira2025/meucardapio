// Fonte única da marca — todo texto/metadado que precisa citar o nome da
// plataforma importa daqui em vez de escrever a string na mão, pra nunca
// mais existir uma divergência de grafia/branding espalhada pelo código.
export const BRAND_NAME = "CardápioPontoCom";

// Partes do wordmark, usadas pelo componente <Logo /> para estilizar o
// nome como um domínio real (jogo com "Ponto Com" = ".com") em vez de só
// escrever o nome inteiro numa fonte qualquer.
export const BRAND_WORDMARK = {
  prefix: "cardápio",
  dot: ".",
  suffix: "com",
} as const;

export const BRAND_TAGLINE =
  "Cardápio digital e pedidos para restaurantes, lanchonetes, hamburguerias, bares e pizzarias.";

export function pageTitle(title: string) {
  return `${title} | ${BRAND_NAME}`;
}
