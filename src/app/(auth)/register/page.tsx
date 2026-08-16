import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { pageTitle } from "@/config/brand";

export const metadata: Metadata = {
  title: pageTitle("Criar conta"),
};

export default function RegisterPage() {
  return <RegisterForm />;
}
