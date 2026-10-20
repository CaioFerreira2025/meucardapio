import { ArrowRight, Lock, Receipt } from "lucide-react";

// ============================================================================
// NfeIntegrationCard
// ============================================================================
//
// Mesmo padrão do IfoodIntegrationCard: ferramenta de upsell "sob
// consulta", não uma integração de verdade. Nenhuma NF-e é emitida e
// nenhum cálculo de tributo acontece aqui — o botão só abre o WhatsApp
// direto para a conversa com um especialista, sem simular nenhum passo de
// configuração (removido o modal intermediário que existia antes, porque
// dois cliques e um rótulo "Solicitar Integração" davam a entender
// autoatendimento).

export interface NfeIntegrationCardProps {
  /**
   * Número de WhatsApp do time comercial, formato internacional e só
   * dígitos (sem "+", sem espaço — ex: "5511999999999"). Por padrão usa o
   * mesmo número já configurado em login-form.tsx / IfoodIntegrationCard.
   */
  salesWhatsappNumber?: string;
  /** Mensagem pré-preenchida ao abrir a conversa no WhatsApp. */
  salesMessage?: string;
  /** Classe extra para encaixar o card no grid/layout da página. */
  className?: string;
}

// Mesmo número de WhatsApp já usado como canal de suporte/comercial em
// src/components/auth/login-form.tsx e no IfoodIntegrationCard — mantém um
// único contato em todo o produto em vez de espalhar números diferentes
// pelo código.
const DEFAULT_WHATSAPP_NUMBER = "5516991408438";
const DEFAULT_SALES_MESSAGE =
  "Olá, quero solicitar a liberação e análise de viabilidade do módulo fiscal para o meu estabelecimento.";

const BULLETS = [
  "Conversa com especialista antes de qualquer contratação",
  "Diagnóstico do seu regime tributário antes da implantação",
];

export function NfeIntegrationCard({
  salesWhatsappNumber = DEFAULT_WHATSAPP_NUMBER,
  salesMessage = DEFAULT_SALES_MESSAGE,
  className = "",
}: NfeIntegrationCardProps) {
  const whatsappUrl = `https://wa.me/${salesWhatsappNumber}?text=${encodeURIComponent(
    salesMessage
  )}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#121815] p-6 ${className}`}
    >
      {/* Brilho de fundo bem sutil — mesmo tratamento visual do card do
          iFood, para manter os dois com a mesma linguagem "premium". */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-[90px]"
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/20">
            <Receipt className="size-5 text-emerald-400" strokeWidth={2} />
          </span>

          <h3 className="text-lg font-semibold text-white">
            Módulo Fiscal &amp; Tributos{" "}
            <span className="font-normal text-zinc-400">(Sob Demanda)</span>
          </h3>

          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-2.5 py-1 text-[10px] font-bold tracking-wide text-black uppercase shadow-md shadow-emerald-900/40">
            Plano Pro+
          </span>
        </div>

        <p className="text-sm leading-relaxed text-zinc-400">
          Emissão de NFC-e/NF-e e organização dos tributos de cada venda. A
          implantação é avaliada e acompanhada por um especialista, caso a
          caso — não é uma configuração automática.
        </p>

        <ul className="flex flex-col gap-1.5">
          {BULLETS.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-2 text-sm text-zinc-300"
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-400" />
              {bullet}
            </li>
          ))}
        </ul>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-emerald-400"
        >
          <Lock className="size-4" strokeWidth={2.5} />
          Solicitar Liberação com Consultor
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );
}
