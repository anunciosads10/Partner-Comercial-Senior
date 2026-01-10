'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle,
  Zap,
  Award,
  Users,
  BarChart,
  GitFork,
  Settings,
  ShieldCheck,
  DollarSign,
  Layers,
  Repeat,
  CreditCard,
  Target,
  FileText
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Header Component
function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <svg
            className="w-8 h-8 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 7L12 12L22 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 12V22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="ml-2 text-lg font-bold">PartnerVerse</span>
        </div>
        <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
          <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Características</Link>
          <Link href="#benefits" className="transition-colors hover:text-foreground/80 text-foreground/60">Beneficios</Link>
          <Link href="#solution" className="transition-colors hover:text-foreground/80 text-foreground/60">Solución</Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
           <Link href="/login">
            <Button variant="outline">Iniciar Sesión</Button>
          </Link>
          <Link href="/register">
            <Button>Empezar Ahora</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div className="flex flex-col items-center p-6 text-center bg-card rounded-lg shadow-sm">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
      {icon}
    </div>
    <h3 className="mb-2 text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

// Main Page Component
export default function LandingPage() {
  const dashboardImage = PlaceHolderImages.find(p => p.id === 'landing-dashboard');
  const growthImage = PlaceHolderImages.find(p => p.id === 'landing-growth');
  
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-1 lg:gap-12 xl:grid-cols-1">
              <div className="flex flex-col justify-center space-y-4 text-center">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  La Plataforma Definitiva para la Gestión de Socios
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
                  Escala tu negocio, automatiza comisiones y potencia a tus partners con una solución todo-en-uno.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                  <Link href="/register">
                    <Button size="lg">Quiero ser Partner</Button>
                  </Link>
                   <Link href="/login">
                    <Button size="lg" variant="secondary">Invita a tus Partners</Button>
                  </Link>
                </div>
                 <div className="mt-4 flex justify-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-primary" /> Configuraciones Flexibles</div>
                    <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-primary" /> Programa de Partners</div>
                    <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-primary" /> Gestión y Liquidaciones</div>
                </div>
              </div>
            </div>
            <div className="mt-12 flex justify-center">
                <Card className="w-full max-w-4xl overflow-hidden shadow-2xl">
                    <CardContent className="p-2">
                        <Image
                            src={dashboardImage.imageUrl}
                            width={1200}
                            height={600}
                            alt={dashboardImage.description}
                            className="rounded-md object-cover"
                            data-ai-hint={dashboardImage.imageHint}
                        />
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Vender solo limita tu crecimiento exponencial</h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Nuestra plataforma te da las herramientas para construir una red de socios sólida que impulse tus ventas de manera predecible y escalable.
                  </p>
                </div>
                <ul className="grid gap-2 py-4">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="flex items-center gap-2 text-lg font-bold"><Zap className="h-5 w-5 text-primary"/> Automatización de Comisiones</h3>
                      <p className="text-muted-foreground">Define esquemas complejos y deja que el sistema calcule y asigne comisiones automáticamente.</p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                       <h3 className="flex items-center gap-2 text-lg font-bold"><Award className="h-5 w-5 text-primary"/> Tiers y Recompensas</h3>
                      <p className="text-muted-foreground">Incentiva a tus mejores socios con niveles y beneficios exclusivos basados en su rendimiento.</p>
                    </div>
                  </li>
                  <li>
                     <div className="grid gap-1">
                      <h3 className="flex items-center gap-2 text-lg font-bold"><Users className="h-5 w-5 text-primary"/> Portal de autogestión</h3>
                      <p className="text-muted-foreground">Ofrece a tus socios un panel personal para ver su rendimiento, comisiones y enlaces de referido.</p>
                    </div>
                  </li>
                </ul>
              </div>
                <div className="flex flex-col justify-center items-center">
                    <Image
                        src={growthImage.imageUrl}
                        width="600"
                        height="600"
                        alt={growthImage.description}
                        className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
                        data-ai-hint={growthImage.imageHint}
                    />
                </div>
            </div>
          </div>
        </section>

        {/* All-in-One Solution Section */}
        <section id="solution" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Una solución todo-en-uno</h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4">
              Desde la gestión de programas hasta el pago de comisiones, PartnerVerse centraliza todas las operaciones de tu ecosistema de socios.
            </p>
            <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-12">
              <FeatureCard icon={<Layers />} title="Múltiples Programas" description="Crea y administra diferentes programas de afiliados según tus necesidades." />
              <FeatureCard icon={<Repeat />} title="Comisiones Dinámicas" description="Configura comisiones recurrentes, por primer pago o basadas en niveles." />
              <FeatureCard icon={<CreditCard />} title="Gestión de Pagos" description="Controla los ciclos de pago y registra cada transacción de forma segura." />
              <FeatureCard icon={<BarChart />} title="Reportes en Real-Time" description="Obtén insights valiosos sobre el rendimiento de tus socios y programas." />
              <FeatureCard icon={<GitFork />} title="Jerarquía de Partners" description="Visualiza y gestiona redes de sub-partners para un crecimiento multinivel." />
              <div className="flex flex-col items-center justify-center p-6 text-center bg-primary text-primary-foreground rounded-lg shadow-sm">
                <h3 className="mb-2 text-lg font-semibold">¿Listo para escalar?</h3>
                <p className="text-sm opacity-80 mb-4">Empieza a construir tu red de socios hoy mismo.</p>
                 <Link href="/register" className="w-full">
                    <Button variant="secondary">Explorar la Plataforma</Button>
                  </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="w-full py-6 md:py-12 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">&copy; 2024 PartnerVerse. Todos los derechos reservados.</p>
            <nav className="flex gap-4 sm:gap-6">
                <Link href="/terms" className="text-sm hover:underline underline-offset-4">Términos de Servicio</Link>
                <Link href="/privacy" className="text-sm hover:underline underline-offset-4">Política de Privacidad</Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
