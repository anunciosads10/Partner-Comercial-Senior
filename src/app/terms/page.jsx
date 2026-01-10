
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="ml-2 text-lg font-bold">PartnerVerse</span>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Link href="/login"><Button variant="outline">Iniciar Sesión</Button></Link>
          <Link href="/register"><Button>Empezar Ahora</Button></Link>
        </div>
      </div>
    </header>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <LandingHeader />
      <main className="flex-1 py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">Términos de Servicio</CardTitle>
                <CardDescription>Última actualización: 24 de Julio de 2024</CardDescription>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground space-y-4">
                <p>Bienvenido a PartnerVerse. Estos términos y condiciones describen las reglas y regulaciones para el uso del sitio web de PartnerVerse, ubicado en [URL de tu sitio web]. Al acceder a este sitio web, asumimos que aceptas estos términos y condiciones. No continúes usando PartnerVerse si no estás de acuerdo con todos los términos y condiciones establecidos en esta página.</p>
                
                <h3 className="font-semibold text-foreground pt-4">1. Cuentas y Responsabilidad</h3>
                <p>Cuando creas una cuenta con nosotros, debes proporcionarnos información precisa, completa y actual en todo momento. El no hacerlo constituye un incumplimiento de los Términos, lo que puede resultar en la terminación inmediata de tu cuenta en nuestro Servicio.</p>
                
                <h3 className="font-semibold text-foreground pt-4">2. Propiedad Intelectual</h3>
                <p>El Servicio y su contenido original, características y funcionalidad son y seguirán siendo propiedad exclusiva de PartnerVerse y sus licenciantes. El Servicio está protegido por derechos de autor, marcas registradas y otras leyes tanto de Colombia como de países extranjeros.</p>

                <h3 className="font-semibold text-foreground pt-4">3. Terminación</h3>
                <p>Podemos terminar o suspender tu cuenta inmediatamente, sin previo aviso ni responsabilidad, por cualquier motivo, incluido, entre otros, si incumples los Términos. Tras la terminación, tu derecho a utilizar el Servicio cesará inmediatamente.</p>

                <h3 className="font-semibold text-foreground pt-4">4. Ley Aplicable</h3>
                <p>Estos Términos se regirán e interpretarán de acuerdo con las leyes de Colombia, sin tener en cuenta sus disposiciones sobre conflictos de leyes.</p>
                
                <div className="pt-6">
                  <Link href="/">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="w-full py-6 md:py-12 border-t bg-background">
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
