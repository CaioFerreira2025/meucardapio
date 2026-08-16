"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Plan } from "@/config/plans";

export function CheckoutButton({
  plan,
  isAuthenticated,
  className,
}: {
  plan: Plan;
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
        body: JSON.stringify({ planId: plan.id }),
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
      variant={plan.highlighted ? "default" : "outline"}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? "Redirecionando..." : "Assinar"}
    </Button>
  );
}
