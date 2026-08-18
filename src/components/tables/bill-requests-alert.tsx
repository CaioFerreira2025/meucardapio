"use client";

import { useState, useTransition } from "react";
import { Bell, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCents } from "@/lib/currency";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/payment-method";
import { closeTable } from "@/app/(dashboard)/dashboard/orders/actions";

type TableBillOrder = {
  id: string;
  customerName: string;
  createdAt: Date;
  items: { id: string; productName: string; quantity: number; unitPriceCents: number }[];
};

type TableBillRequest = {
  tableNumber: string;
  totalCents: number;
  orders: TableBillOrder[];
  requestedSince: Date;
};

// Alerta visual de mesas que pediram a conta — usado tanto em Visão Geral
// quanto na Central de Pedidos (mesma fonte de dados: getTablesAwaitingBill).
export function BillRequestsAlert({ tables }: { tables: TableBillRequest[] }) {
  if (tables.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
        <Bell className="size-4 shrink-0 animate-pulse" />
        {tables.length === 1
          ? "1 mesa pediu a conta"
          : `${tables.length} mesas pediram a conta`}
      </div>
      <div className="flex flex-col gap-2">
        {tables.map((table) => (
          <TableRow key={table.tableNumber} table={table} />
        ))}
      </div>
    </div>
  );
}

function TableRow({ table }: { table: TableBillRequest }) {
  const [open, setOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isPending, startTransition] = useTransition();

  // Agrega os itens de todos os pedidos ativos da mesa por produto, para um
  // resumo mais fácil de conferir do que uma lista repetida por pedido.
  const aggregated = new Map<
    string,
    { productName: string; quantity: number; totalCents: number }
  >();
  for (const order of table.orders) {
    for (const item of order.items) {
      const existing = aggregated.get(item.productName);
      const lineTotal = item.unitPriceCents * item.quantity;
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalCents += lineTotal;
      } else {
        aggregated.set(item.productName, {
          productName: item.productName,
          quantity: item.quantity,
          totalCents: lineTotal,
        });
      }
    }
  }
  const lines = Array.from(aggregated.values());

  function handleConfirm() {
    startTransition(async () => {
      try {
        await closeTable(table.tableNumber, paymentMethod);
        toast.success(`Mesa ${table.tableNumber} fechada.`);
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao fechar a mesa."
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2.5 ring-1 ring-white/5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">
            Mesa {table.tableNumber}
          </p>
          <p className="text-xs text-muted-foreground">
            {table.orders.length}{" "}
            {table.orders.length === 1 ? "pedido" : "pedidos"} ·{" "}
            <span className="text-brand-300">{formatCents(table.totalCents)}</span>
          </p>
        </div>
        <DialogTrigger
          render={
            <Button size="sm" variant="outline" className="shrink-0 gap-1.5">
              <Receipt className="size-3.5" />
              Fechar mesa
            </Button>
          }
        />
      </div>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechar Mesa {table.tableNumber}</DialogTitle>
          <DialogDescription>
            Confira o consumo total antes de encerrar os pedidos dessa mesa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
            {lines.map((line) => (
              <div key={line.productName} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {line.quantity}x {line.productName}
                </span>
                <span className="text-muted-foreground">
                  {formatCents(line.totalCents)}
                </span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-border pt-2 text-sm font-medium">
              <span>Total da mesa</span>
              <span className="text-brand-300">{formatCents(table.totalCents)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-white">Forma de pagamento</p>
            <div className="flex gap-1.5">
              {(["cash", "pix", "card"] as PaymentMethod[]).map((method) => (
                <Button
                  key={method}
                  type="button"
                  size="sm"
                  variant={paymentMethod === method ? "default" : "outline"}
                  className={
                    paymentMethod === method
                      ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-400 hover:to-brand-300"
                      : undefined
                  }
                  onClick={() => setPaymentMethod(method)}
                >
                  {PAYMENT_METHOD_LABEL[method]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button disabled={isPending} onClick={handleConfirm}>
            {isPending ? "Fechando..." : "Confirmar fechamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
