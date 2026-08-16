"use client"

import { usePathname } from "next/navigation"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  // Não há um seletor de tema global (nenhum ThemeProvider no app) — o
  // "tema" aqui é definido por zona de rota: painel (/dashboard) e
  // cardápio público (/r/[slug]) são sempre escuros (ver .dark em
  // globals.css); login, cadastro, preços e a landing continuam claros.
  // Decidir isso pela rota evita depender de next-themes/preferência do
  // sistema operacional, que ficaria dessincronizado do tema real da página.
  const pathname = usePathname()
  const isDarkZone = pathname?.startsWith("/dashboard") || pathname?.startsWith("/r/")
  const theme: ToasterProps["theme"] = isDarkZone ? "dark" : "light"

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
