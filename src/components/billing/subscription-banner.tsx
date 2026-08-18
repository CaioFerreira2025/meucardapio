import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AccessState } from "@/lib/access";

// Banner de status da assinatura no topo da Visão Geral. Server component
// puro (sem estado): recebe o estado já resolvido por getAccessState().
//
// Regra de ouro do tom: o alerta cresce em destaque só quando há algo a
// fazer. Assinatura em dia é a maioria dos dias de uso do lojista, então
// esse caso é discreto de propósito — um banner vermelho gritando todo dia
// vira ruído e a pessoa para de ler justamente quando importa.
export function SubscriptionBanner({ state }: { state: AccessState }) {
  // Admin/modo suporte não tem assinatura própria — nada a mostrar.
  if (state.kind === "staff") return null;

  const formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  // ===== 1. Bloqueado: teste acabou, pagamento falhou ou assinatura encerrada =====
  if (!state.hasFullAccess) {
    const copy = {
      trial_expired: {
        title: "Seu teste gratuito terminou",
        body: "Escolha um plano para voltar a usar o painel e continuar recebendo pedidos pelo cardápio digital.",
      },
      past_due: {
        title: "Não conseguimos confirmar seu pagamento",
        body: "Sua assinatura está com pagamento pendente. Regularize para reativar o acesso ao painel.",
      },
      canceled: {
        title: "Sua assinatura foi encerrada",
        body: "Assine novamente para retomar o acesso completo ao painel.",
      },
    }[state.kind as "trial_expired" | "past_due" | "canceled"];

    return (
      <Banner
        tone="danger"
        icon={<AlertTriangle className="size-5 shrink-0" />}
        title={copy.title}
        body={copy.body}
        action={{ href: "/pricing", label: "Ver planos" }}
      />
    );
  }

  // ===== 2. Teste em andamento =====
  if (state.kind === "trial") {
    const diasLabel = state.daysLeft === 1 ? "1 dia" : `${state.daysLeft} dias`;

    if (state.endingSoon) {
      return (
        <Banner
          tone="warning"
          icon={<Clock className="size-5 shrink-0" />}
          title={`Seu teste gratuito acaba em ${diasLabel}`}
          body={`Assine agora para não perder o acesso ao painel${
            state.endsAt ? ` em ${formatDate(state.endsAt)}` : ""
          }. Seus dados e pedidos continuam salvos.`}
          action={{ href: "/pricing", label: "Escolher plano" }}
        />
      );
    }

    return (
      <Banner
        tone="info"
        icon={<Sparkles className="size-5 shrink-0" />}
        title={`Teste gratuito — ${diasLabel} restantes`}
        body="Você está com acesso completo a todos os recursos. Aproveite para configurar seu cardápio."
        action={{ href: "/pricing", label: "Ver planos" }}
      />
    );
  }

  // ===== 3. Assinatura ativa =====
  const planName = state.plan?.name;

  if (state.endingSoon && state.endsAt) {
    return (
      <Banner
        tone="warning"
        icon={<Clock className="size-5 shrink-0" />}
        title={`Sua assinatura vence em ${
          state.daysLeft === 1 ? "1 dia" : `${state.daysLeft} dias`
        }`}
        body={`Renovação prevista para ${formatDate(
          state.endsAt
        )}. Garanta que seu pagamento está em dia para não ter interrupção.`}
        action={{ href: "/dashboard/billing", label: "Ver cobrança" }}
      />
    );
  }

  return (
    <Banner
      tone="success"
      icon={<CheckCircle2 className="size-5 shrink-0" />}
      title={planName ? `Plano ${planName} ativo` : "Assinatura ativa"}
      body={
        state.endsAt
          ? `Tudo certo por aqui. Próxima renovação em ${formatDate(state.endsAt)}.`
          : "Tudo certo por aqui."
      }
      action={{ href: "/dashboard/billing", label: "Gerenciar" }}
    />
  );
}

const TONES = {
  danger: {
    wrapper: "border-red-500/30 bg-red-500/[0.07]",
    icon: "text-red-300",
    title: "text-red-100",
  },
  warning: {
    wrapper: "border-amber-500/30 bg-amber-500/[0.07]",
    icon: "text-amber-300",
    title: "text-amber-100",
  },
  info: {
    wrapper: "border-orange-500/25 bg-orange-500/[0.05]",
    icon: "text-orange-300",
    title: "text-orange-100",
  },
  success: {
    wrapper: "border-emerald-500/25 bg-emerald-500/[0.05]",
    icon: "text-emerald-300",
    title: "text-emerald-100",
  },
} as const;

function Banner({
  tone,
  icon,
  title,
  body,
  action,
}: {
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  title: string;
  body: string;
  action: { href: string; label: string };
}) {
  const styles = TONES[tone];

  return (
    <div
      data-slot="subscription-banner"
      data-tone={tone}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        styles.wrapper
      )}
    >
      <div className="flex items-start gap-3">
        <span className={styles.icon}>{icon}</span>
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold", styles.title)}>{title}</p>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant={tone === "danger" || tone === "warning" ? "default" : "outline"}
        className={cn(
          "shrink-0",
          tone === "danger" &&
            "bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-400 hover:to-rose-400"
        )}
        render={<Link href={action.href}>{action.label}</Link>}
      />
    </div>
  );
}
