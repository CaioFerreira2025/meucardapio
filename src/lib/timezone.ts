// Timezone do restaurante (Brasil — sem horário de verão desde 2019, então
// um offset fixo de -03:00 é seguro o ano inteiro). Usado para calcular
// "início do dia de hoje" em queries de faturamento/estatísticas (Visão
// Geral, Caixa).
//
// Bug crítico que isso corrige: o cálculo antigo, `new Date(new
// Date().setHours(0, 0, 0, 0))`, usa o timezone do PROCESSO NODE (em
// produção/Vercel isso é UTC), não o do restaurante. Como o Brasil está 3h
// atrás do UTC, o relógio do servidor vira "amanhã" 3h ANTES da meia-noite
// local — ou seja, o "hoje" do servidor troca de dia às 21h no horário de
// Brasília, bem no meio do horário de pico do jantar. A partir desse
// momento, todo pedido novo (feito ainda "hoje" pro restaurante) passava a
// cair fora do filtro `createdAt >= startOfToday`, e o faturamento do dia
// na Visão Geral/Caixa zerava de repente até a meia-noite real chegar.
const RESTAURANT_TIME_ZONE = "America/Sao_Paulo";
const RESTAURANT_UTC_OFFSET = "-03:00";

// Retorna o instante UTC correspondente à meia-noite de "hoje" no timezone
// do restaurante — pronto para usar direto em `createdAt: { gte: ... }`.
export function startOfTodayForRestaurant(referenceDate: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(referenceDate);

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  return new Date(`${year}-${month}-${day}T00:00:00${RESTAURANT_UTC_OFFSET}`);
}
