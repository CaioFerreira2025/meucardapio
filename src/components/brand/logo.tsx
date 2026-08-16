import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/config/brand";

// Símbolo da marca: não é um garfo/faca genérico — é um "ponto de conexão"
// (anel + ponto), lembrando ao mesmo tempo um marcador de QR Code sendo
// lido. Um único glifo abstrato, simples o bastante pra continuar legível
// em 16px (favicon) e em 40px (sidebar do painel).
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
    >
      <rect width="32" height="32" rx="9" fill="url(#logo-mark-gradient)" />
      <circle
        cx="13.5"
        cy="13.5"
        r="6.5"
        stroke="white"
        strokeOpacity="0.92"
        strokeWidth="2.25"
      />
      <circle cx="21.5" cy="21.5" r="3.4" fill="white" />
      <defs>
        <linearGradient
          id="logo-mark-gradient"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f97316" />
          <stop offset="1" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const WORDMARK_TEXT_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

export function LogoWordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    // Token semântico (não cor fixa) — assim o mesmo componente funciona
    // tanto em fundo claro (login/cadastro) quanto escuro (painel, cardápio
    // público, landing, planos), sempre com contraste correto em cada um.
    <span
      className={cn(
        "font-semibold tracking-tight whitespace-nowrap text-foreground",
        WORDMARK_TEXT_SIZE[size],
        className
      )}
    >
      {BRAND_NAME}
    </span>
  );
}

const MARK_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "size-7",
  md: "size-8",
  lg: "size-10",
};

// Lockup completo (símbolo + wordmark) usado em cabeçalhos e sidebars.
// `markOnly` renderiza só o símbolo — útil em espaços muito comprimidos
// (barra de abas mobile, avatar).
export function Logo({
  size = "md",
  markOnly = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  markOnly?: boolean;
  className?: string;
}) {
  if (markOnly) {
    return <LogoMark className={cn(MARK_SIZE[size], className)} />;
  }

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark className={MARK_SIZE[size]} />
      <LogoWordmark size={size} />
    </span>
  );
}
