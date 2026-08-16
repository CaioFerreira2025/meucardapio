"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Substitui o antigo ManageBillingButton (que abria o Billing Portal
// hospedado do Stripe). A Cakto não tem um portal de autoatendimento
// equivalente (troca de cartão, faturas etc.) — o que a API dela oferece é
// cancelar a assinatura, então é isso que esse botão faz, com confirmação
// antes por ser uma ação sem volta fácil (para assinar de novo depois é
// preciso passar pelo checkout outra vez).
export function CancelSubscriptionButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? "Não foi possível cancelar a assinatura.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Assinatura cancelada.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erro de rede ao cancelar a assinatura.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" disabled={isSubmitting || isPending}>
            {isSubmitting ? "Cancelando..." : "Cancelar assinatura"}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso encerra as próximas cobranças na Cakto. Para assinar de novo
            depois, basta escolher um plano outra vez em &quot;Ver planos&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Cancelar assinatura
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
