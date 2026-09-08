"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

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
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { BRAND_NAME } from "@/config/brand";

// Suporte via WhatsApp para quem esqueceu a senha — não há fluxo de "esqueci
// minha senha" automatizado ainda, então o link abre uma conversa já com a
// mensagem pronta para o número de suporte (formato internacional, sem o "+").
const SUPPORT_WHATSAPP_NUMBER = "5516991408438";
const FORGOT_PASSWORD_MESSAGE =
  "Olá, preciso de ajuda para recuperar minha senha no sistema.";
const forgotPasswordWhatsAppUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  FORGOT_PASSWORD_MESSAGE
)}`;

export function LoginForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginInput) => {
    setIsSubmitting(true);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setIsSubmitting(false);
      toast.error("Email ou senha incorretos.");
      return;
    }

    // Causa real do "precisa clicar duas vezes": `router.push` faz uma
    // navegação client-side (soft navigation) que pode reaproveitar o
    // Router Cache do Next.js — inclusive um redirecionamento para /login
    // cacheado de uma visita ANTERIOR ao /dashboard feita deslogado (ex.:
    // o próprio callbackUrl que trouxe a pessoa para esta tela). Como
    // `(dashboard)/layout.tsx` decide se redireciona para /login checando
    // a sessão no servidor a cada acesso, o primeiro clique já autentica
    // de verdade (o cookie de sessão é gravado antes do `await` acima
    // terminar), mas a navegação seguinte podia reaproveitar aquele
    // resultado antigo e devolver a pessoa para o login mesmo já
    // autenticada — daí precisar clicar de novo para "pegar".
    //
    // Trocar por uma navegação completa (não client-side) elimina essa
    // corrida: o navegador faz uma requisição nova do zero para
    // `callbackUrl`, que já sai com o cookie de sessão recém-gravado, sem
    // depender de nenhum cache de rota do lado do cliente.
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
    window.location.assign(callbackUrl);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-white">Entrar</CardTitle>
        <CardDescription>
          Acesse sua conta para continuar no {BRAND_NAME}.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Senha</Label>
              <a
                href={forgotPasswordWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-brand-300 hover:underline"
              >
                Esqueceu a senha?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-800/20 hover:from-brand-400 hover:to-brand-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/register" className="font-medium text-brand-300 underline-offset-4 hover:underline">
              Criar conta
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
