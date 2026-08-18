"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/config/plans";

export function CheckoutButton({
  planId,
  cycle,
  highlighted = false,
  isAuthenticated,
  className,
}: {
  planId: "starter" | "pro";
  // O ciclo escolhido viaja junto: é ele que define QUAL das seis ofertas
  // da Cakto será aberta (ver src/config/plans.ts).
  cycle: BillingCycle;
  highlighted?: boolean;
  isAuthenticated: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, cycle }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Não foi possível iniciar o checkout.");
        setIsLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Erro de rede ao iniciar o checkout.");
      setIsLoading(false);
    }
  };

  return (
    <Button
      className={cn("w-full", className)}
      variant={highlighted ? "default" : "outline"}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? "Redirecionando..." : "Assinar"}
    </Button>
  );
}
