"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { slugify } from "@/lib/slug";
import { createRestaurant, type OnboardingState } from "./actions";

const initialState: OnboardingState = {};

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    createRestaurant,
    initialState
  );
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-white">Crie seu restaurante</CardTitle>
        <CardDescription>
          Essas informações aparecem no seu cardápio digital público.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome do restaurante</Label>
            <Input
              id="name"
              name="name"
              placeholder="Lanchonete do João"
              required
              onChange={(event) => {
                if (!slugTouched) {
                  setSlug(slugify(event.target.value));
                }
              }}
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">URL do cardápio</Label>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">/r/</span>
              <Input
                id="slug"
                name="slug"
                value={slug}
                placeholder="lanchonete-do-joao"
                required
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
              />
            </div>
            {state.fieldErrors?.slug && (
              <p className="text-xs text-destructive">{state.fieldErrors.slug}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input id="phone" name="phone" placeholder="(11) 99999-9999" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" placeholder="Opcional" />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-800/20 hover:from-brand-400 hover:to-brand-300"
            disabled={isPending}
          >
            {isPending ? "Criando..." : "Criar restaurante"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
