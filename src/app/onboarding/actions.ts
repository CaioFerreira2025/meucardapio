"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { restaurantSchema } from "@/lib/validations/restaurant";

export type OnboardingState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createRestaurant(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado" };
  }

  const parsed = restaurantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const existing = await prisma.restaurant.findUnique({
    where: { ownerId: session.user.id },
  });
  if (existing) {
    redirect("/dashboard");
  }

  const slugTaken = await prisma.restaurant.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (slugTaken) {
    return { fieldErrors: { slug: "Essa URL já está em uso, escolha outra." } };
  }

  await prisma.restaurant.create({
    data: {
      ownerId: session.user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      description: parsed.data.description || null,
    },
  });

  redirect("/dashboard");
}
