import { ArrowRight, Lock, ShoppingBag } from "lucide-react";

// ============================================================================
// IfoodIntegrationCard
// ============================================================================
//
// Ferramenta de upsell, não uma integração de verdade. O objetivo do
// componente é deixar claro para o lojista que a integração com o iFood
// existe no roadmap, mas que ela é "sob consulta": nenhuma chamada de API
// real acontece aqui, só a captação de interesse comercial — o botão abre
// o WhatsApp direto, sem simular nenhum passo de configuração.
//
// Antes esse card tinha um botão "Solicitar Integração" que abria um
// modal com um segundo botão "Falar com Vendas" — dois passos que, juntos
// com o rótulo, davam a entender que o lojista estava configurando algo
// sozinho (autoatendimento). Removido de propósito: um único clique leva
// direto para a conversa com um especialista, e o nome do card já avisa
// que é "sob consulta".
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
  "Olá, quero solicitar a liberação e análise de viabilidade da integração com o iFood para o meu estabelecimento.";

const BULLETS = [
  "Conversa com especialista antes de qualquer contratação",
  "Avaliação de viabilidade feita sob medida para o seu CNPJ",
];

export function IfoodIntegrationCard({
  salesWhatsappNumber = DEFAULT_WHATSAPP_NUMBER,
  salesMessage = DEFAULT_SALES_MESSAGE,
  className = "",
}: IfoodIntegrationCardProps) {
  const whatsappUrl = `https://wa.me/${salesWhatsappNumber}?text=${encodeURIComponent(
    salesMessage
  )}`;

  return (
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

          <h3 className="text-lg font-semibold text-white">
            Integração iFood{" "}
            <span className="font-normal text-zinc-400">
              (Disponível sob consulta)
            </span>
          </h3>

          {/* Selo agressivo de propósito: gradiente saturado, uppercase,
              texto bem pequeno e denso — chama atenção sem ocupar espaço. */}
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-2.5 py-1 text-[10px] font-bold tracking-wide text-black uppercase shadow-md shadow-emerald-900/40">
            Plano Pro+
          </span>
        </div>

        <p className="text-sm leading-relaxed text-zinc-400">
          Centralize os pedidos do iFood no mesmo painel. A implantação é
          avaliada e acompanhada por um especialista, caso a caso — não é
          uma configuração automática.
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
          Falar com Especialista
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );
}
