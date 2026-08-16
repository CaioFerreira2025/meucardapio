"use client";

import { useTransition } from "react";
import { ExternalLink, LogIn, Store } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { startImpersonation } from "@/app/admin/actions";

type Subscriber = {
  id: string;
  name: string;
  slug: string;
  ownerName: string | null;
  ownerEmail: string;
  whatsapp: string | null;
  planName: string | null;
  priceCents: number | null;
  status: string | null;
  cancelAtPeriodEnd: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  trialing: "Em teste",
  active: "Ativa",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  unpaid: "Não paga",
  incomplete: "Incompleta",
  incomplete_expired: "Expirada",
  paused: "Pausada",
};

const STATUS_STYLE: Record<string, string> = {
  trialing: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
  active: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  past_due: "bg-orange-500/15 text-orange-300 ring-orange-500/25",
  canceled: "bg-white/10 text-zinc-400 ring-white/10",
  unpaid: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
  incomplete: "bg-white/10 text-zinc-400 ring-white/10",
  incomplete_expired: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
  paused: "bg-white/10 text-zinc-400 ring-white/10",
};

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function SubscribersTable({ subscribers }: { subscribers: Subscriber[] }) {
  if (subscribers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400/20 to-rose-500/20 ring-1 ring-orange-500/20">
          <Store className="size-5 text-orange-300" />
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhum restaurante cadastrado ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-zinc-400">Nome</TableHead>
            <TableHead className="text-zinc-400">Responsável</TableHead>
            <TableHead className="text-zinc-400">WhatsApp</TableHead>
            <TableHead className="text-zinc-400">Valor</TableHead>
            <TableHead className="text-zinc-400">Status de pagamento</TableHead>
            <TableHead className="text-right text-zinc-400">Suporte</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.map((subscriber) => (
            <SubscriberRow key={subscriber.id} subscriber={subscriber} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SubscriberRow({ subscriber }: { subscriber: Subscriber }) {
  const [isPending, startTransition] = useTransition();

  function handleAccess() {
    startTransition(async () => {
      try {
        await startImpersonation(subscriber.id);
      } catch (error) {
        // `redirect()` dentro da Server Action lança um erro especial do
        // Next (identificado pelo campo `digest`, não pela mensagem) pra
        // navegar — não é uma falha de verdade, deixa passar.
        const digest =
          error && typeof error === "object" && "digest" in error
            ? String((error as { digest?: unknown }).digest)
            : "";
        if (digest.startsWith("NEXT_REDIRECT")) {
          throw error;
        }
        toast.error(
          error instanceof Error ? error.message : "Erro ao acessar o painel do cliente."
        );
      }
    });
  }

  return (
    <TableRow className="border-white/10">
      <TableCell>
        <p className="font-medium text-white">{subscriber.name}</p>
        <p className="text-xs text-muted-foreground">/r/{subscriber.slug}</p>
      </TableCell>
      <TableCell>
        <p className="text-zinc-300">{subscriber.ownerName ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{subscriber.ownerEmail}</p>
      </TableCell>
      <TableCell className="text-zinc-300">
        {subscriber.whatsapp ? (
          <a
            href={whatsappUrl(subscriber.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-orange-300 underline-offset-4 hover:underline"
          >
            {subscriber.whatsapp}
            <ExternalLink className="size-3" />
          </a>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-zinc-300">
        {subscriber.priceCents !== null ? (
          <>
            <span className="font-medium text-white">
              {formatCents(subscriber.priceCents)}
            </span>
            {subscriber.planName && (
              <span className="text-xs text-muted-foreground"> / {subscriber.planName}</span>
            )}
          </>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>
        {subscriber.status ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1",
              STATUS_STYLE[subscriber.status] ??
                "bg-white/10 text-zinc-300 ring-white/10"
            )}
          >
            {STATUS_LABEL[subscriber.status] ?? subscriber.status}
            {subscriber.cancelAtPeriodEnd && " · cancela ao fim do período"}
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-zinc-400 ring-1 ring-white/10">
            Sem assinatura
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          className="gap-1.5"
          onClick={handleAccess}
        >
          <LogIn className="size-3.5" />
          {isPending ? "Entrando..." : "Acessar Dashboard"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
