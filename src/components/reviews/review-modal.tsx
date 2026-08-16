"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { submitReview } from "@/app/r/[slug]/actions";

const RATING_LABELS: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Ok",
  4: "Boa",
  5: "Excelente",
};

// Modal de avaliação da experiência — acionado pelo menu inferior do
// cardápio público (Mais -> Avaliar experiência). Sem cadastro/login do
// cliente: só nota (1 a 5 estrelas) e um comentário opcional, enviados
// pela Server Action `submitReview` (src/app/r/[slug]/actions.ts) direto
// pra tabela Review — o lojista vê tudo em Painel -> Avaliações.
export function ReviewModal({
  slug,
  open,
  onOpenChange,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setRating(0);
    setHoverRating(0);
    setComment("");
  }

  async function handleSubmit() {
    if (rating === 0) {
      toast.error("Escolha de 1 a 5 estrelas.");
      return;
    }

    setIsSubmitting(true);
    const result = await submitReview({ slug, rating, comment: comment || undefined });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Obrigado pela avaliação!");
    reset();
    onOpenChange(false);
  }

  const displayRating = hoverRating || rating;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Avaliar experiência</DialogTitle>
          <DialogDescription>
            Como foi seu pedido? Sua avaliação ajuda o restaurante a
            melhorar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
                className="p-1"
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(value)}
              >
                <Star
                  className={cn(
                    "size-8 transition-colors",
                    value <= displayRating
                      ? "fill-orange-400 text-orange-400"
                      : "fill-transparent text-zinc-600"
                  )}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          <p className="h-4 text-sm text-muted-foreground">
            {displayRating > 0 ? RATING_LABELS[displayRating] : ""}
          </p>
        </div>

        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Conte um pouco mais (opcional)"
          maxLength={500}
        />

        <DialogFooter>
          <Button
            className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-600/20 hover:from-orange-400 hover:to-rose-400"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
