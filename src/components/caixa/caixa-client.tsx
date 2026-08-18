"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Banknote,
  CreditCard,
  Lock,
  LockOpen,
  QrCode,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCents, parseCentsFromInput } from "@/lib/currency";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/payment-method";
import {
  closeCashSession,
  openCashSession,
  setOrderPaymentMethod,
} from "@/app/(dashboard)/dashboard/caixa/actions";

type OpenSession = {
  id: string;
  openedAt: Date;
  openingCents: number;
  cashRevenueSinceOpenCents: number;
};

type Breakdown = { cash: number; pix: number; card: number; unset: number };

type UntaggedOrder = {
  id: string;
  customerName: string;
  tableNumber: string | null;
  totalCents: number;
  createdAt: Date;
};

type ClosedSession = {
  id: string;
  openedAt: Date;
  closedAt: Date;
  openingCents: number;
  closingCents: number;
  expectedCents: number;
};

function formatDateTime(date: Date) {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CaixaClient({
  openSession,
  breakdown,
  todayTotalCents,
  untaggedOrders,
  recentClosedSessions,
}: {
  openSession: OpenSession | null;
  breakdown: Breakdown;
  todayTotalCents: number;
  untaggedOrders: UntaggedOrder[];
  recentClosedSessions: ClosedSession[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BreakdownCard
          icon={Banknote}
          label="Dinheiro"
          value={breakdown.cash}
          color="emerald"
        />
        <BreakdownCard icon={QrCode} label="Pix" value={breakdown.pix} color="violet" />
        <BreakdownCard
          icon={CreditCard}
          label="Cartão"
          value={breakdown.card}
          color="orange"
        />
        <BreakdownCard
          icon={Wallet}
          label="Faturamento hoje"
          value={todayTotalCents}
          color="orange"
          emphasis
        />
      </div>

      <TurnoCard openSession={openSession} />

      {untaggedOrders.length > 0 && (
        <UntaggedOrdersCard orders={untaggedOrders} />
      )}

      {recentClosedSessions.length > 0 && (
        <HistoryCard sessions={recentClosedSessions} />
      )}
    </div>
  );
}

function BreakdownCard({
  icon: Icon,
  label,
  value,
  color,
  emphasis,
}: {
  icon: typeof Banknote;
  label: string;
  value: number;
  color: "orange" | "emerald" | "violet";
  emphasis?: boolean;
}) {
  const colorMap = {
    orange: "from-orange-400/20 to-orange-600/20 text-orange-300 ring-orange-500/20",
    emerald:
      "from-emerald-400/20 to-emerald-600/20 text-emerald-300 ring-emerald-500/20",
    violet: "from-violet-400/20 to-violet-600/20 text-violet-300 ring-violet-500/20",
  };
  return (
    <Card className="flex-row items-center gap-4 px-4">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ${colorMap[color]}`}
      >
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p
          className={`truncate font-semibold tracking-tight text-foreground ${
            emphasis ? "text-2xl" : "text-xl"
          }`}
        >
          {formatCents(value)}
        </p>
      </div>
    </Card>
  );
}

function TurnoCard({ openSession }: { openSession: OpenSession | null }) {
  const [openingValue, setOpeningValue] = useState("");
  const [closingValue, setClosingValue] = useState("");
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const expectedSoFarCents = openSession
    ? openSession.openingCents + openSession.cashRevenueSinceOpenCents
    : 0;

  const closingCentsPreview = useMemo(
    () => parseCentsFromInput(closingValue),
    [closingValue]
  );
  const diffCents =
    closingCentsPreview !== null ? closingCentsPreview - expectedSoFarCents : null;

  function handleOpen() {
    const cents = parseCentsFromInput(openingValue || "0");
    if (cents === null) {
      toast.error("Informe um valor de abertura válido.");
      return;
    }
    startTransition(async () => {
      try {
        await openCashSession(cents);
        toast.success("Turno de caixa aberto.");
        setOpeningValue("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao abrir o caixa.");
      }
    });
  }

  function handleClose() {
    if (!openSession) return;
    const cents = parseCentsFromInput(closingValue);
    if (cents === null) {
      toast.error("Informe o valor contado na gaveta.");
      return;
    }
    startTransition(async () => {
      try {
        await closeCashSession(openSession.id, cents);
        toast.success("Turno fechado com sucesso.");
        setClosingValue("");
        setCloseDialogOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao fechar o caixa.");
      }
    });
  }

  if (!openSession) {
    return (
      // Estado "caixa fechado": além do campo de abertura, explica as três
      // etapas do turno. Quem nunca usou controle de caixa não sabe o que é
      // "valor de abertura" nem por que o sistema pede isso antes de vender
      // — e um campo solitário pedindo um número não responde essa dúvida.
      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-20 h-56 w-56 rounded-full bg-orange-500/10 blur-[90px]"
        />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2.5 text-base text-white">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400/20 to-rose-500/20 ring-1 ring-orange-500/25">
              <LockOpen className="size-4 text-orange-300" />
            </span>
            Abra o turno para começar o dia
          </CardTitle>
          <CardDescription className="pt-1">
            O caixa acompanha o dinheiro em espécie da sua gaveta — quanto
            entrou de venda e se bate no fim do expediente.
          </CardDescription>
        </CardHeader>

        <CardContent className="relative flex flex-col gap-4">
          <ol className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            {[
              {
                title: "Informe o troco",
                body: "O dinheiro que já está na gaveta antes da primeira venda.",
              },
              {
                title: "Venda normalmente",
                body: "Pedidos pagos em dinheiro entram no caixa sozinhos.",
              },
              {
                title: "Feche e confira",
                body: "Conte a gaveta e veja se sobrou ou faltou.",
              },
            ].map((step, index) => (
              <li
                key={step.title}
                className="flex flex-1 gap-2.5 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">{step.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="opening-cents">Valor de abertura (troco)</Label>
              <Input
                id="opening-cents"
                inputMode="decimal"
                placeholder="0,00"
                value={openingValue}
                onChange={(e) => setOpeningValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Não tem troco na gaveta? Informe 0,00 e siga.
              </p>
            </div>
            <Button
              disabled={isPending}
              className="gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-600/20 hover:from-orange-400 hover:to-rose-400"
              onClick={handleOpen}
            >
              <LockOpen className="size-4" />
              {isPending ? "Abrindo..." : "Abrir caixa"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <span className="size-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
          Turno em andamento
        </CardTitle>
        <CardDescription>
          Aberto em {formatDateTime(openSession.openedAt)}
        </CardDescription>
        <CardAction>
          <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="gap-2">
                  <Lock className="size-4" />
                  Fechar turno
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fechar turno de caixa</DialogTitle>
                <DialogDescription>
                  Conte o dinheiro físico na gaveta e informe o valor abaixo.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 rounded-xl bg-white/[0.03] p-3 text-sm ring-1 ring-white/5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Abertura</span>
                    <span className="text-white">
                      {formatCents(openSession.openingCents)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Vendas em dinheiro no turno
                    </span>
                    <span className="text-white">
                      {formatCents(openSession.cashRevenueSinceOpenCents)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 font-medium">
                    <span className="text-muted-foreground">Saldo esperado</span>
                    <span className="text-orange-300">
                      {formatCents(expectedSoFarCents)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="closing-cents">Valor contado na gaveta</Label>
                  <Input
                    id="closing-cents"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={closingValue}
                    onChange={(e) => setClosingValue(e.target.value)}
                  />
                </div>

                {diffCents !== null && (
                  <p
                    className={`text-sm font-medium ${
                      diffCents === 0
                        ? "text-emerald-300"
                        : diffCents > 0
                          ? "text-violet-300"
                          : "text-rose-300"
                    }`}
                  >
                    {diffCents === 0
                      ? "Confere exatamente com o esperado."
                      : diffCents > 0
                        ? `Sobra de ${formatCents(diffCents)} em relação ao esperado.`
                        : `Falta de ${formatCents(Math.abs(diffCents))} em relação ao esperado.`}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button disabled={isPending} onClick={handleClose}>
                  {isPending ? "Fechando..." : "Confirmar fechamento"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
            <p className="text-xs text-muted-foreground">Abertura</p>
            <p className="text-lg font-semibold text-white">
              {formatCents(openSession.openingCents)}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
            <p className="text-xs text-muted-foreground">Vendas em dinheiro</p>
            <p className="text-lg font-semibold text-white">
              {formatCents(openSession.cashRevenueSinceOpenCents)}
            </p>
          </div>
          <div className="rounded-xl bg-orange-500/10 p-3 ring-1 ring-orange-500/20">
            <p className="text-xs text-orange-200/80">Saldo esperado na gaveta</p>
            <p className="text-lg font-semibold text-orange-300">
              {formatCents(expectedSoFarCents)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UntaggedOrdersCard({ orders }: { orders: UntaggedOrder[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleTag(orderId: string, method: PaymentMethod) {
    setPendingId(orderId);
    startTransition(async () => {
      try {
        await setOrderPaymentMethod(orderId, method);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao registrar pagamento."
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-white">
          Pedidos sem forma de pagamento
        </CardTitle>
        <CardDescription>
          Classifique os pedidos de hoje para o faturamento por forma de
          pagamento ficar correto.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex flex-col gap-2 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {order.customerName}
                {order.tableNumber && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · Mesa {order.tableNumber}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(order.createdAt)} ·{" "}
                <span className="text-orange-300">
                  {formatCents(order.totalCents)}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              {(["cash", "pix", "card"] as PaymentMethod[]).map((method) => (
                <Button
                  key={method}
                  size="sm"
                  variant="outline"
                  disabled={isPending && pendingId === order.id}
                  onClick={() => handleTag(order.id, method)}
                >
                  {PAYMENT_METHOD_LABEL[method]}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HistoryCard({ sessions }: { sessions: ClosedSession[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-white">Últimos fechamentos</CardTitle>
        <CardDescription>Histórico dos turnos de caixa mais recentes.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {sessions.map((session) => {
          const diff = session.closingCents - session.expectedCents;
          return (
            <div
              key={session.id}
              className="flex flex-col gap-1 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-white">
                {formatDateTime(session.openedAt)} → {formatDateTime(session.closedAt)}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                <span>Abertura {formatCents(session.openingCents)}</span>
                <span>Esperado {formatCents(session.expectedCents)}</span>
                <span>Contado {formatCents(session.closingCents)}</span>
                <span
                  className={
                    diff === 0
                      ? "text-emerald-300"
                      : diff > 0
                        ? "text-violet-300"
                        : "text-rose-300"
                  }
                >
                  {diff === 0
                    ? "Bateu certo"
                    : diff > 0
                      ? `Sobra ${formatCents(diff)}`
                      : `Falta ${formatCents(Math.abs(diff))}`}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
