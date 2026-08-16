"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
// cliente: nota (1 a 5 estrelas) obrigatória, e nome/telefone/comentário
// opcionais, enviados pela Server Action `submitReview`
// (src/app/r/[slug]/actions.ts) direto pra tabela Review — o lojista vê
// tudo em Painel -> Avaliações, com um atalho de WhatsApp quando o
// cliente informou o telefone.
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setRating(0);
    setHoverRating(0);
    setComment("");
    setName("");
    setPhone("");
  }

  async function handleSubmit() {
    if (rating === 0) {
      toast.error("Escolha de 1 a 5 estrelas.");
      return;
    }

    setIsSubmitting(true);
    const result = await submitReview({
      slug,
      rating,
      comment: comment || undefined,
      name: name || undefined,
      phone: phone || undefined,
    });
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
      {/* `max-h-[85dvh]` (altura de viewport dinâmica) em vez de `vh` fixo
          — no mobile, quando o teclado abre pra preencher nome/telefone/
          comentário, a área visível encolhe; `dvh` acompanha isso, `vh`
          fica "preso" na medida de antes do teclado abrir e pode deixar o
          botão de enviar escondido atrás do teclado. Mesmo padrão de
          "modal alto com rolagem interna" do checkout (ver menu-client.tsx):
          `flex flex-col overflow-hidden` no modal, `overflow-y-auto` só na
          área de campos, e o rodapé (botão) fica FORA da área que rola —
          sempre visível, nunca escondido. */}
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="gap-0.5 p-4 pb-3">
          <DialogTitle className="text-white">Avaliar experiência</DialogTitle>
          <DialogDescription>
            Como foi seu pedido? Sua avaliação ajuda o restaurante a
            melhorar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
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

          <div className="flex flex-col gap-3 border-t border-border pt-4 pb-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="review-name">Seu nome (opcional)</Label>
              <Input
                id="review-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Como podemos te chamar?"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="review-phone">Telefone / WhatsApp (opcional)</Label>
              <Input
                id="review-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(11) 99999-9999"
              />
              <p className="text-xs text-muted-foreground">
                Só usamos pra o restaurante poder te responder, se precisar.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 pt-3">
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
