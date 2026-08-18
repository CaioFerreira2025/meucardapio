"use client";

import { useState } from "react";
import { Archive, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/orders/order-card";

type OrderItem = {
  id: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  notes: string | null;
};

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  tableNumber: string | null;
  notes: string | null;
  status: string;
  totalCents: number;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  archived: boolean;
};

// Botão "Ver histórico arquivado" no topo da Central de pedidos + a lista de
// pedidos que o lojista ocultou do quadro kanban ativo, em qualquer status
// (ver OrderCard "Ocultar pedido" / server action `setOrderArchived`).
// Puramente um filtro de visualização — os pedidos continuam no banco, só
// saem do quadro ativo pra não poluir a tela; aqui dá pra achá-los de novo
// e, se precisar, restaurar pro quadro ativo (o card continua com todos os
// botões normais de status, então dá pra avançar/cancelar um pedido ativo
// mesmo estando arquivado).
export function ArchivedOrdersSection({
  orders,
  canCopyOrder = false,
}: {
  orders: Order[];
  canCopyOrder?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit gap-1.5"
        onClick={() => setOpen((value) => !value)}
      >
        <Archive className="size-3.5" />
        Ver histórico arquivado
        {orders.length > 0 && (
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-xs font-normal text-zinc-400 ring-1 ring-white/10">
            {orders.length}
          </span>
        )}
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </Button>

      {open && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-400">
            Histórico arquivado
          </h2>
          {orders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhum pedido arquivado.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} canCopyOrder={canCopyOrder} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
