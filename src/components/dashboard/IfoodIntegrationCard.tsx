"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lock, ShoppingBag, X } from "lucide-react";

// ============================================================================
// IfoodIntegrationCard
// ============================================================================
//
// Ferramenta de upsell, não uma integração de verdade. O objetivo do
// componente é deixar claro para o lojista que a tecnologia de integração
// com o iFood existe no roadmap do GreyPack, mas que ela é um recurso do
// Plano Pro+ — nenhuma chamada de API real acontece aqui, só a captação de
// interesse comercial (o botão "Falar com Vendas" abre o WhatsApp).
//
// lucide-react não tem um ícone de marca do iFood (ele só traz ícones
// genéricos), então usamos `ShoppingBag` como um substituto neutro que
// comunica "pedidos/delivery" sem violar a marca do iFood. Se você tiver o
// SVG oficial do logo, troque o <ShoppingBag .../> abaixo por ele.

export interface IfoodIntegrationCardProps {
  /**
   * Número de WhatsApp do time comercial, formato internacional e só
   * dígitos (sem "+", sem espaço — ex: "5511999999999"). Por padrão usa o
   * mesmo número já configurado em login-form.tsx.
   */
  salesWhatsappNumber?: string;
  /** Mensagem pré-preenchida ao abrir a conversa no WhatsApp. */
  salesMessage?: string;
  /** Classe extra para encaixar o card no grid/layout da página. */
  className?: string;
}

// Mesmo número de WhatsApp já usado como canal de suporte/comercial em
// src/components/auth/login-form.tsx — mantém um único contato em todo o
// produto em vez de espalhar números diferentes pelo código.
const DEFAULT_WHATSAPP_NUMBER = "5516991408438";
const DEFAULT_SALES_MESSAGE =
  "Olá! Quero saber mais sobre a integração do GreyPack com o iFood (Plano Pro+).";

const BENEFITS = [
  "Pedidos caem direto na comanda digital.",
  "Zero digitação manual na cozinha.",
  "Faturamento unificado.",
];

export function IfoodIntegrationCard({
  salesWhatsappNumber = DEFAULT_WHATSAPP_NUMBER,
  salesMessage = DEFAULT_SALES_MESSAGE,
  className = "",
}: IfoodIntegrationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Trava o scroll do body enquanto o modal está aberto e fecha com Esc —
  // comportamento padrão esperado de qualquer modal, sem precisar de
  // nenhuma lib extra de foco/overlay.
  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  const whatsappUrl = `https://wa.me/${salesWhatsappNumber}?text=${encodeURIComponent(
    salesMessage
  )}`;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#121815] p-6 ${className}`}
      >
        {/* Brilho de fundo bem sutil — reforça o ar "premium" sem competir
            com o conteúdo do card. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-[90px]"
        />

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/20">
              <ShoppingBag className="size-5 text-emerald-400" strokeWidth={2} />
            </span>

            <h3 className="text-lg font-semibold text-white">Integração iFood</h3>

            {/* Selo agressivo de propósito: gradiente saturado, uppercase,
                texto bem pequeno e denso — chama atenção sem ocupar espaço. */}
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-2.5 py-1 text-[10px] font-bold tracking-wide text-black uppercase shadow-md shadow-emerald-900/40">
              Plano Pro+
            </span>
          </div>

          <p className="text-sm leading-relaxed text-zinc-400">
            Centralize os pedidos do iFood diretamente no painel do GreyPack
            em tempo real.
          </p>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-emerald-400"
          >
            <Lock className="size-4" strokeWidth={2.5} />
            Solicitar Integração
          </button>
        </div>
      </div>

      {isModalOpen && (
        <UpsellModal
          whatsappUrl={whatsappUrl}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------------
// Modal — separado como subcomponente só para manter o JSX do card legível.
// Continua no mesmo arquivo de propósito (um único componente de drop-in).
// ----------------------------------------------------------------------------

function UpsellModal({
  whatsappUrl,
  onClose,
}: {
  whatsappUrl: string;
  onClose: () => void;
}) {
  return (
    <div
      role="presentation"
      // Clique no backdrop fecha; clique dentro do card do modal não
      // propaga (ver stopPropagation abaixo), então só fecha quando o
      // clique é mesmo fora do conteúdo.
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ifood-upsell-title"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#121815] shadow-2xl shadow-black/60"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-400/20">
              <ShoppingBag className="size-4 text-emerald-400" strokeWidth={2} />
            </span>
            <h2 id="ifood-upsell-title" className="text-base font-semibold text-white">
              Integração iFood — Plano Pro+
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex flex-col gap-5 p-6">
          <p className="text-sm leading-relaxed text-zinc-400">
            A rota de API dedicada para sincronizar pedidos do iFood em tempo
            real é exclusiva de quem está no{" "}
            <span className="font-semibold text-white">Plano Pro+</span>.
            Libere esse acesso e pare de alternar entre o painel do iFood e o
            do GreyPack para não perder pedido.
          </p>

          <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" strokeWidth={2.5} />
                <p className="text-sm text-zinc-200">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Cancelar
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-emerald-400"
          >
            Falar com Vendas
          </a>
        </div>
      </div>
    </div>
  );
}
