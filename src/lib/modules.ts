import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { getModule } from "@/modules/registry";

/**
 * Chaves dos módulos ligados para um restaurante.
 *
 * `cache()` garante uma ida só ao banco por requisição, mesmo sendo
 * consultado no layout (para montar o menu) e de novo na rota do módulo
 * (para autorizar) — os dois acontecem no mesmo render.
 *
 * A lista é filtrada contra o registro de propósito: se um módulo for
 * removido do código mas a linha continuar no banco de algum cliente, ele
 * simplesmente deixa de aparecer, em vez de gerar um item de menu que leva
 * a lugar nenhum.
 */
export const getEnabledModuleKeys = cache(
  async (restaurantId: string): Promise<string[]> => {
    const rows = await prisma.restaurantModule.findMany({
      where: { restaurantId },
      select: { moduleKey: true },
      orderBy: { enabledAt: "asc" },
    });

    return rows.map((r) => r.moduleKey).filter((key) => Boolean(getModule(key)));
  }
);

/**
 * Autorização de um módulo para um restaurante.
 *
 * Precisa ser checado no SERVIDOR, dentro da rota do módulo — esconder o
 * item do menu não é controle de acesso: quem digitar a URL na barra de
 * endereços chegaria na tela do mesmo jeito.
 */
export async function isModuleEnabled(
  restaurantId: string,
  moduleKey: string
): Promise<boolean> {
  const keys = await getEnabledModuleKeys(restaurantId);
  return keys.includes(moduleKey);
}
