import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ANNUAL_DISCOUNT_PERCENT, PLANS } from "@/config/plans";
import { formatCents } from "@/lib/currency";
import type { AccessState } from "@/lib/access";

// Tela mostrada no lugar do conteúdo de uma página do painel quando o acesso
// está bloqueado (teste expirado, pagamento pendente ou assinatura
// encerrada). Renderizada NO LUGAR do conteúdo, e não como redirecionamento,
// de propósito: o lojista continua vendo em que página está e o menu lateral
// segue navegável, então "Cobrança" e "Configurações" (as duas telas que
// permanecem liberadas) ficam a um clique — em vez de ele cair sempre no
// mesmo lugar sem entender o que aconteceu.
export function PaywallScreen({ state }: { state: AccessState }) {
  const headline = {
    trial_expired: "Seu teste gratuito de 15 dias terminou",
    trial_unavailable: "Escolha um plano para começar",
    past_due: "Sua assinatura está com pagamento pendente",
    canceled: "Sua assinatura foi encerrada",
  }[state.kind as "trial_expired" | "trial_unavailable" | "past_due" | "canceled"] ??
    "Escolha um plano para continuar";

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="flex max-w-xl flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400/20 to-rose-500/20 ring-1 ring-orange-500/25">
          <Lock className="size-5 text-orange-300" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {headline}
        </h1>
        <p className="text-muted-foreground">
          Escolha um plano para voltar a usar o painel. Seu cardápio digital
          continua no ar e seus dados, pedidos e clientes seguem salvos — nada
          foi perdido.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={
              plan.highlighted
                ? "relative flex flex-col gap-4 rounded-2xl border border-orange-500/40 bg-gradient-to-b from-orange-500/[0.08] to-white/[0.02] p-6"
                : "relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            }
          >
            {plan.highlighted && (
              <span className="absolute top-5 right-5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                Mais escolhido
              </span>
            )}
            <div>
              <p className="font-semibold text-white">{plan.name}</p>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-white">
              {formatCents(plan.prices.annual.monthlyEquivalentCents)}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="-mt-2 text-xs text-emerald-300">
              no plano anual · economize {ANNUAL_DISCOUNT_PERCENT}%
            </p>
            <ul className="flex flex-1 flex-col gap-1.5 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-400 hover:to-rose-400"
          render={<Link href="/pricing">Escolher meu plano</Link>}
        />
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/dashboard/billing">Ver detalhes da cobrança</Link>}
        />
      </div>
    </div>
  );
}
