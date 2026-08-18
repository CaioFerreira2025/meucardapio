import type { Metadata } from "next";
import { Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getEffectiveRestaurant } from "@/lib/restaurant-context";
import { pageTitle } from "@/config/brand";
import { formatCents } from "@/lib/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerHistoryDialog } from "@/components/customers/customer-history-dialog";
import { PaywallScreen } from "@/components/billing/paywall-screen";
import { getAccessState } from "@/lib/access";

export const metadata: Metadata = {
  title: pageTitle("Clientes"),
};

export default async function CustomersPage() {
  // Paywall: com o teste expirado (ou pagamento pendente/assinatura
  // encerrada) esta tela dá lugar à escolha de plano. Só "Cobrança" e
  // "Configurações" seguem liberadas — são justamente as telas que o lojista
  // precisa para voltar a ficar em dia.
  const access = await getAccessState();
  if (!access.hasFullAccess) {
    return <PaywallScreen state={access} />;
  }

  const restaurant = await getEffectiveRestaurant();

  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant!.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      tableNumber: true,
      status: true,
      totalCents: true,
      createdAt: true,
    },
  });

  // Agrega o histórico de pedidos (já existente) por cliente — nenhum
  // cadastro de cliente novo é criado, só uma leitura agregada sobre
  // `Order`, agrupada por telefone (identificador estável do cliente).
  type CustomerStats = {
    // Chave de agrupamento (telefone, ou nome quando não há telefone — ex.:
    // pedidos lançados pela Comanda do garçom, que não coletam telefone).
    // Guardada à parte de `phone` porque `phone` sozinho pode se repetir
    // (várias comandas sem telefone) e não pode virar `key` do React abaixo.
    key: string;
    phone: string;
    name: string;
    orders: typeof orders;
    orderCount: number;
    totalSpentCents: number;
    lastOrderAt: Date;
  };

  const byPhone = new Map<string, CustomerStats>();
  for (const order of orders) {
    const key = order.customerPhone.trim() || order.customerName.trim();
    const existing = byPhone.get(key);
    if (existing) {
      existing.orders.push(order);
      if (order.status !== "cancelled") {
        existing.orderCount += 1;
        existing.totalSpentCents += order.totalCents;
      }
      if (order.createdAt > existing.lastOrderAt) {
        existing.lastOrderAt = order.createdAt;
        existing.name = order.customerName;
      }
    } else {
      byPhone.set(key, {
        key,
        phone: order.customerPhone,
        name: order.customerName,
        orders: [order],
        orderCount: order.status !== "cancelled" ? 1 : 0,
        totalSpentCents: order.status !== "cancelled" ? order.totalCents : 0,
        lastOrderAt: order.createdAt,
      });
    }
  }

  const customers = Array.from(byPhone.values()).sort(
    (a, b) => b.totalSpentCents - a.totalSpentCents
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Clientes</h1>
        <p className="text-muted-foreground">
          Quem já pediu no seu cardápio, quanto gastou e quando voltou.
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400/20 to-rose-500/20 ring-1 ring-orange-500/20">
            <Users className="size-5 text-orange-300" />
          </div>
          <p className="text-sm text-muted-foreground">
            Assim que os primeiros pedidos chegarem, seus clientes aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400">Cliente</TableHead>
                <TableHead className="text-zinc-400">Pedidos</TableHead>
                <TableHead className="text-zinc-400">Total gasto</TableHead>
                <TableHead className="text-zinc-400">Ticket médio</TableHead>
                <TableHead className="text-zinc-400">Último pedido</TableHead>
                <TableHead className="text-right text-zinc-400">Histórico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const ticketMedio =
                  customer.orderCount > 0
                    ? Math.round(customer.totalSpentCents / customer.orderCount)
                    : 0;
                return (
                  <TableRow key={customer.key} className="border-white/10">
                    <TableCell>
                      <p className="font-medium text-white">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    </TableCell>
                    <TableCell className="text-zinc-300">{customer.orderCount}</TableCell>
                    <TableCell className="font-medium text-orange-300">
                      {formatCents(customer.totalSpentCents)}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {formatCents(ticketMedio)}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {customer.lastOrderAt.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <CustomerHistoryDialog
                        customerName={customer.name}
                        orders={customer.orders}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
