"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductImageUpload } from "@/components/menu/product-image-upload";
import {
  updateRestaurantSettings,
  type SettingsFormState,
} from "@/app/(dashboard)/dashboard/settings/actions";

const initialState: SettingsFormState = {};

type ExistingRestaurant = {
  name: string;
  phone: string | null;
  address: string | null;
  description: string | null;
  logoUrl: string | null;
};

export function RestaurantSettingsForm({
  restaurant,
}: {
  restaurant: ExistingRestaurant;
}) {
  const [state, formAction, isPending] = useActionState(
    updateRestaurantSettings,
    initialState
  );
  const [logoUrl, setLogoUrl] = useState(restaurant.logoUrl ?? "");

  // Mesmo padrão já usado em CategoryFormDialog/ProductFormDialog: reagir a
  // uma transição de `isPending` (pendente -> concluído) atualizando estado
  // durante a renderização, em vez de um useEffect — recomendado pelo
  // React para esse tipo de "resposta a uma mudança".
  const [prevPending, setPrevPending] = useState(isPending);
  if (isPending !== prevPending) {
    setPrevPending(isPending);
    if (!isPending && state.success) {
      toast.success("Configurações salvas!");
    } else if (!isPending && state.error) {
      toast.error(state.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Identidade do restaurante</CardTitle>
        <CardDescription>
          Essas informações aparecem no seu cardápio digital público e no QR
          Code das mesas.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex flex-col gap-1.5">
            <Label>Logo do restaurante</Label>
            <input type="hidden" name="logoUrl" value={logoUrl} />
            <ProductImageUpload value={logoUrl} onChange={setLogoUrl} />
            <p className="text-xs text-muted-foreground">
              Aparece no topo do cardápio público e na tela do QR Code, no
              lugar do ícone genérico.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome do restaurante</Label>
            <Input
              id="name"
              name="name"
              defaultValue={restaurant.name}
              placeholder="Lanchonete do João"
              required
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={restaurant.phone ?? ""}
              placeholder="(11) 99999-9999"
            />
            {state.fieldErrors?.phone && (
              <p className="text-xs text-destructive">{state.fieldErrors.phone}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              name="address"
              defaultValue={restaurant.address ?? ""}
              placeholder="Opcional"
            />
            {state.fieldErrors?.address && (
              <p className="text-xs text-destructive">{state.fieldErrors.address}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={restaurant.description ?? ""}
              placeholder="Uma frase curta sobre o seu restaurante"
            />
            {state.fieldErrors?.description && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.description}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-600/20 hover:from-orange-400 hover:to-rose-400"
          >
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
