"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ManageBillingButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing-portal", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Não foi possível abrir o portal de cobrança.");
        setIsLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Erro de rede ao abrir o portal de cobrança.");
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Abrindo..." : "Gerenciar assinatura"}
    </Button>
  );
}
