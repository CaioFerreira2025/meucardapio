import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { pageTitle } from "@/config/brand";

export const metadata: Metadata = {
  title: pageTitle("Entrar"),
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
