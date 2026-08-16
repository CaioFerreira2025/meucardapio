"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { requestBill } from "@/app/r/[slug]/pedido/[orderId]/actions";

export function RequestBillButton({
  orderId,
  initialRequested,
  canRequest,
}: {
  orderId: string;
  initialRequested: boolean;
  canRequest: boolean;
}) {
  const [requested, setRequested] = useState(initialRequested);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!canRequest) return null;

  async function handleClick() {
    setIsSubmitting(true);
    const result = await requestBill(orderId);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setRequested(true);
    toast.success("Conta solicitada! A equipe já foi avisada.");
  }

  return (
    <Button
      variant="outline"
      disabled={requested || isSubmitting}
      className="gap-2"
      onClick={handleClick}
    >
      <Receipt className="size-4" />
      {requested
        ? "Conta solicitada"
        : isSubmitting
          ? "Enviando..."
          : "Pedir a conta"}
    </Button>
  );
}
