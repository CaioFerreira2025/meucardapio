import { Bike } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/currency";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { ModulePageProps } from "@/modules/registry";
import { DeleteZoneButton, DeliveryZonesForm } from "@/modules/entregas/form";

// MÓDULO: Entregas (chave "entregas")
//
// Cadastro de bairros com taxa fixa. A taxa entra no carrinho do cardápio
// público (ver menu-client.tsx) somente quando o módulo está ligado — quem
// não tem o módulo nem vê o campo de bairro no checkout.
export default async function EntregasModule({ restaurantId }: ModulePageProps) {
  const zones = await prisma.deliveryZone.findMany({
    where: { restaurantId },
    orderBy: [{ position: "asc" }, { neighborhood: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <DeliveryZonesForm />

      {zones.length === 0 ? (
        <EmptyState
          icon={Bike}
          title="Nenhum bairro cadastrado ainda"
          description="Cadastre os bairros que você atende e a taxa de cada um. No checkout, o cliente escolhe o bairro e a taxa entra no total automaticamente. Bairro não cadastrado não aparece como opção — é assim que você limita sua área de entrega."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Bairro</th>
                <th className="px-4 py-3 font-medium">Taxa de entrega</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 text-white">{zone.neighborhood}</td>
                  <td className="px-4 py-3">
                    {zone.feeCents === 0 ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        Grátis
                      </span>
                    ) : (
                      <span className="text-brand-300">{formatCents(zone.feeCents)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteZoneButton zoneId={zone.id} name={zone.neighborhood} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
