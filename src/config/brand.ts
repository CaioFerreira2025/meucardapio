// Fonte única da marca — todo texto/metadado que precisa citar o nome da
// plataforma importa daqui em vez de escrever a string na mão, pra nunca
// mais existir uma divergência de grafia/branding espalhada pelo código.
export const BRAND_NAME = "Meu Restaurante";

export const BRAND_TAGLINE =
  "Cardápio digital e pedidos para restaurantes, lanchonetes, hamburguerias, bares e pizzarias.";

export function pageTitle(title: string) {
  return `${title} | ${BRAND_NAME}`;
}
