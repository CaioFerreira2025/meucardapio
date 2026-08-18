"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { saveBusinessHours } from "@/modules/actions";
import { minutesToHHMM, WEEKDAY_LABELS, type BusinessHourRow } from "@/modules/shared";

export function BusinessHoursForm({
  hours,
  openNow,
  hasSchedule,
}: {
  hours: BusinessHourRow[];
  openNow: boolean;
  hasSchedule: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  // Campos CONTROLADOS (e não `defaultValue`/`defaultChecked`).
  //
  // Com campos não controlados, salvar dispara `revalidatePath`: o servidor
  // re-renderiza esta tela com valores novos enquanto os mesmos inputs
  // continuam montados. O Base UI avisa no console que o valor inicial de um
  // campo não controlado mudou depois de inicializado — e, pior, o que
  // aparece na tela passa a ser o valor antigo do navegador, não o que
  // acabou de ser salvo. Com estado local, a tela e o formulário contam a
  // mesma história.
  const [rows, setRows] = useState(hours);

  function updateRow(weekday: number, patch: Partial<BusinessHourRow>) {
    setRows((prev) =>
      prev.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row))
    );
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await saveBusinessHours(formData);
        toast.success("Horários salvos. O cardápio já segue essa agenda.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {/* Estado ATUAL em destaque: é a pergunta que o lojista faz ao abrir
          esta tela ("minha loja está aberta agora?"), e responder isso antes
          de mostrar a agenda evita que ele precise conferir de cabeça. */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-4",
          openNow
            ? "border-emerald-500/25 bg-emerald-500/[0.06]"
            : "border-zinc-500/25 bg-white/[0.03]"
        )}
      >
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            openNow ? "animate-pulse bg-emerald-400" : "bg-zinc-500"
          )}
        />
        <div>
          <p className="text-sm font-medium text-white">
            {openNow ? "Sua loja está ABERTA agora" : "Sua loja está FECHADA agora"}
          </p>
          <p className="text-sm text-muted-foreground">
            {hasSchedule
              ? "Segundo a agenda abaixo, no horário de Brasília."
              : "Nenhuma agenda salva ainda — a loja fica aberta até você definir os horários."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-card p-5">
        {rows.map((day) => (
          <div
            key={day.weekday}
            className="flex flex-col gap-3 border-b border-border/50 py-3 last:border-0 sm:flex-row sm:items-center"
          >
            <p className="w-28 shrink-0 text-sm font-medium text-white">
              {WEEKDAY_LABELS[day.weekday]}
            </p>

            <div className="flex items-center gap-2">
              <Switch
                name={`open-${day.weekday}`}
                checked={!day.isClosed}
                onCheckedChange={(checked) =>
                  updateRow(day.weekday, { isClosed: !checked })
                }
                aria-label={`${WEEKDAY_LABELS[day.weekday]}: abrir neste dia`}
                value="on"
              />
              <span className="text-xs text-muted-foreground">Abre neste dia</span>
            </div>

            <div className="flex items-center gap-2 sm:ml-auto">
              <Input
                type="time"
                name={`opens-${day.weekday}`}
                value={minutesToHHMM(day.opensAt)}
                onChange={(e) =>
                  updateRow(day.weekday, { opensAt: hhmmToMinutes(e.target.value) })
                }
                className="w-32"
                aria-label={`${WEEKDAY_LABELS[day.weekday]}: abre às`}
              />
              <span className="text-sm text-muted-foreground">às</span>
              <Input
                type="time"
                name={`closes-${day.weekday}`}
                value={minutesToHHMM(day.closesAt)}
                onChange={(e) =>
                  updateRow(day.weekday, { closesAt: hhmmToMinutes(e.target.value) })
                }
                className="w-32"
                aria-label={`${WEEKDAY_LABELS[day.weekday]}: fecha às`}
              />
            </div>
          </div>
        ))}

        <p className="pt-2 text-xs text-muted-foreground">
          Fecha de madrugada? Basta o horário de fechamento ser menor que o de
          abertura (ex.: 18:00 às 02:00) — o sistema entende que o expediente
          vira a noite.
        </p>
      </div>

      <div>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-400 hover:to-rose-400"
        >
          {isPending ? "Salvando..." : "Salvar horários"}
        </Button>
      </div>
    </form>
  );
}

// Espelho de `minutesToHHMM`: o campo <input type="time"> devolve "HH:MM" e
// o estado guarda minutos, mesma unidade do banco.
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return Math.min(24 * 60, Math.max(0, h * 60 + m));
}
