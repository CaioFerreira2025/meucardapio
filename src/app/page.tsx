import { auth } from "@/auth";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { DemoShowcase } from "@/components/landing/demo-showcase";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default async function Home() {
  const session = await auth();

  return (
    // `dark` aqui não muda nada visualmente por si só (a landing já é
    // escura com classes literais como bg-background/text-white) — ela só
    // garante que componentes compartilhados que usam tokens semânticos
    // (ex.: <Logo/>, <Card/>) renderizem certo quando reaproveitados aqui.
    //
    // `overflow-x-hidden` + `max-w-full` aqui são uma rede de segurança: a
    // causa real da barra de rolagem horizontal no celular eram os círculos
    // decorativos de brilho (blur) de cada seção — largos o bastante (ex.:
    // w-[36rem]) para vazar para fora da tela em telas pequenas — sem um
    // `overflow-hidden` no `<section>` pai para conter esse vazamento (só a
    // Hero tinha). Isso já foi corrigido em cada seção (mesmo padrão da
    // Hero), e este container garante que nenhum elemento decorativo futuro
    // volte a estourar a largura da página.
    <div className="dark flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-background">
      <LandingHeader isAuthenticated={Boolean(session?.user)} />
      <main className="flex-1">
        <HeroSection />
        <DemoShowcase />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection isAuthenticated={Boolean(session?.user)} />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
