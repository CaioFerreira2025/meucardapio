import { prisma } from "@/lib/prisma";
import type { ModulePageProps } from "@/modules/registry";
import { BusinessHoursForm } from "@/modules/horarios/form";
import {
  isWithinBusinessHours,
  nowInRestaurantTimezone,
  type BusinessHourRow,
} from "@/modules/shared";

// MÓDULO: Horários (chave "horarios")
//
// A agenda define quando o cardápio público aceita pedidos. A regra em si
// vive em src/modules/shared.ts, porque o cardápio precisa aplicar
// exatamente a mesma — se as duas divergissem, o lojista veria a loja aberta
// enquanto o cliente vê fechada.
export default async function HorariosModule({ restaurantId }: ModulePageProps) {
  const saved = await prisma.businessHour.findMany({
    where: { restaurantId },
    orderBy: { weekday: "asc" },
  });

  // Preenche os 7 dias mesmo que o lojista nunca tenha salvo nada: o
  // formulário sempre mostra a semana inteira, com um padrão razoável.
  const hours: BusinessHourRow[] = Array.from({ length: 7 }, (_, weekday) => {
    const row = saved.find((h) => h.weekday === weekday);
    return {
      weekday,
      opensAt: row?.opensAt ?? 8 * 60,
      closesAt: row?.closesAt ?? 22 * 60,
      isClosed: row?.isClosed ?? false,
    };
  });

  const openNow = isWithinBusinessHours(saved, nowInRestaurantTimezone());

  return <BusinessHoursForm hours={hours} openNow={openNow} hasSchedule={saved.length > 0} />;
}
