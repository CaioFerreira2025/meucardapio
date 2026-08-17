// Fonte única da marca — todo texto/metadado que precisa citar o nome da
// plataforma importa daqui em vez de escrever a string na mão, pra nunca
// mais existir uma divergência de grafia/branding espalhada pelo código.
export const BRAND_NAME = "Meu Restaurante";

export const BRAND_TAGLINE =
  "Cardápio digital e pedidos para restaurantes, lanchonetes, hamburguerias, bares e pizzarias.";

export function pageTitle(title: string) {
  return `${title} | ${BRAND_NAME}`;
}

// Slug do restaurante usado nos links "Ver Cardápio de Demonstração" da
// landing page (hero, CTA final e rodapé — ver src/components/landing/).
// Precisa ser um restaurante que REALMENTE existe no banco de produção;
// era "lanchonete-do-joao" (um restaurante de teste que só existe nos
// ambientes de desenvolvimento), o que fazia esses links caírem na tela
// "Cardápio não encontrado" em produção. Trocado para o restaurante real
// cadastrado — se ele mudar de slug no futuro, atualize só aqui.
export const DEMO_RESTAURANT_SLUG = "cantinho-do-sabor";
