import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getRestaurantByOwnerId } from "@/lib/restaurant";
import { pageTitle } from "@/config/brand";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: pageTitle("Criar restaurante"),
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/onboarding");
  }

  const restaurant = await getRestaurantByOwnerId(session.user.id);
  if (restaurant) {
    redirect("/dashboard");
  }

  return (
    <div className="dark relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-[-15%] left-1/3 h-[32rem] w-[32rem] rounded-full bg-brand-600/10 blur-[130px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-96 w-96 rounded-full bg-rose-600/[0.07] blur-[120px]" />
      </div>
      <div className="relative w-full max-w-md">
        <OnboardingForm />
      </div>
    </div>
  );
}
