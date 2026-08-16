const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCents(cents: number) {
  return formatter.format(cents / 100);
}

// Espera o formato brasileiro "12,90" (vírgula decimal) — é o que o campo
// de preço do formulário pede. "12.90" (ponto) também funciona.
export function parseCentsFromInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  const amount = Number(normalized);
  if (Number.isNaN(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}
