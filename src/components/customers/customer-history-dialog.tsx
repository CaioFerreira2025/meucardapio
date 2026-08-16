"use client";

import { useState } from "react";
import { History } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatCents } from "@/lib/currency";

type HistoryOrder = {
  id: string;
  status: string;
  totalCents: number;
  createdAt: Date;
  tableNumber: string | null;
};

export function CustomerHistoryDialog({
  customerName,
  orders,
}: {
  customerName: string;
  orders: HistoryOrder[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <History className="size-3.5" />
            Histórico
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico — {customerName}</DialogTitle>
          <DialogDescription>
            {orders.length} pedido{orders.length === 1 ? "" : "s"} no total.
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2 ring-1 ring-white/5"
            >
              <div className="min-w-0">
                <p className="text-sm text-white">
                  {order.createdAt.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                  {order.tableNumber && (
                    <span className="text-muted-foreground"> · Mesa {order.tableNumber}</span>
                  )}
                </p>
                <span className="text-sm font-medium text-orange-300">
                  {formatCents(order.totalCents)}
                </span>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
