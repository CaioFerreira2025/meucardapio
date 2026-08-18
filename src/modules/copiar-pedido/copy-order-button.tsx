"use client";

import { useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/currency";

export type CopyableOrder = {
  customerName: string;
  customerPhone: string;
  tableNumber: string | null;
  notes: string | null;
  totalCents: number;
  deliveryFeeCents?: number;
  discountCents?: number;
  neighborhood?: string | null;
  createdAt: Date;
  items: { productName: string; quantity: number; unitPriceCents: number; notes: string | null }[];
};

/**
 * Monta o resumo do pedido em texto puro, pronto para colar no WhatsApp.
 *
 * Decisões de formatação, todas pensadas para quem vai LER isso correndo na
 * cozinha, num celular:
 *
 * - sem tabelas nem alinhamento por espaços: o WhatsApp usa fonte de largura
 *   variável e qualquer "coluna" desmonta;
 * - `*asterisco*` é negrito no WhatsApp — usado só no nome do item e no
 *   total, que é o que a pessoa procura primeiro;
 * - quantidade na frente do nome ("2x Coxinha"), porque o número é a
 *   informação que a cozinha precisa antes do produto;
 * - observações em linha própria e recuadas, para não se perderem no meio.
 */
export function buildOrderText(order: CopyableOrder): string {
  const linhas: string[] = [];

  linhas.push("*NOVO PEDIDO*");
  linhas.push("");

  if (order.tableNumber) linhas.push(`Mesa/Comanda: ${order.tableNumber}`);
  linhas.push(`Cliente: ${order.customerName}`);
  if (order.customerPhone) linhas.push(`WhatsApp: ${order.customerPhone}`);
  if (order.neighborhood) linhas.push(`Bairro: ${order.neighborhood}`);
  linhas.push(
    `Horário: ${order.createdAt.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })}`
  );

  linhas.push("");
  linhas.push("------------------------");
  linhas.push("");

  for (const item of order.items) {
    linhas.push(
      `*${item.quantity}x ${item.productName}* — ${formatCents(
        item.unitPriceCents * item.quantity
      )}`
    );
    if (item.notes) linhas.push(`   obs: ${item.notes}`);
  }

  if (order.notes) {
    linhas.push("");
    linhas.push(`*Observações do pedido:* ${order.notes}`);
  }

  linhas.push("");
  linhas.push("------------------------");
  linhas.push("");

  if (order.discountCents && order.discountCents > 0) {
    linhas.push(`Desconto: -${formatCents(order.discountCents)}`);
  }
  if (order.deliveryFeeCents && order.deliveryFeeCents > 0) {
    linhas.push(`Entrega: ${formatCents(order.deliveryFeeCents)}`);
  }
  linhas.push(`*TOTAL: ${formatCents(order.totalCents)}*`);

  return linhas.join("\n");
}

export function CopyOrderButton({ order }: { order: CopyableOrder }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = buildOrderText(order);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Pedido copiado. É só colar no WhatsApp.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // `navigator.clipboard` exige HTTPS (ou localhost) e permissão. Em
      // contexto inseguro cai aqui — o alternativo com <textarea> +
      // execCommand ainda funciona em praticamente todo navegador.
      try {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
        setCopied(true);
        toast.success("Pedido copiado. É só colar no WhatsApp.");
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Não foi possível copiar neste navegador.");
      }
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      aria-label="Copiar resumo do pedido para o WhatsApp"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-400" />
      ) : (
        <ClipboardCopy className="size-3.5" />
      )}
      {copied ? "Copiado!" : "Copiar"}
    </Button>
  );
}
