import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COLOR_MAP: Record<string, string> = {
  orange: "from-orange-400/20 to-orange-600/20 text-orange-300 ring-orange-500/20",
  emerald:
    "from-emerald-400/20 to-emerald-600/20 text-emerald-300 ring-emerald-500/20",
  violet: "from-violet-400/20 to-violet-600/20 text-violet-300 ring-violet-500/20",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "orange",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color?: "orange" | "emerald" | "violet";
}) {
  return (
    <Card className="flex-row items-center gap-4 px-4">
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1",
          COLOR_MAP[color]
        )}
      >
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
      </div>
    </Card>
  );
}
