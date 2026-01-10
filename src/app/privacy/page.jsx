
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

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <LandingHeader />
      <main className="flex-1 py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">Política de Privacidad</CardTitle>
                <CardDescription>Última actualización: 24 de Julio de 2024</CardDescription>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground space-y-4">
                <p>PartnerVerse ("nosotros", "nuestro" o "nos") se compromete a proteger tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y salvaguardamos tu información cuando visitas nuestro sitio web.</p>
                
                <h3 className="font-semibold text-foreground pt-4">1. Información que Recopilamos</h3>
                <p>Podemos recopilar información de identificación personal, como tu nombre, dirección de correo electrónico y otra información que nos proporciones voluntariamente cuando te registras en el Servicio.</p>
                
                <h3 className="font-semibold text-foreground pt-4">2. Uso de tu Información</h3>
                <p>Usamos la información que recopilamos para operar y mantener nuestro Servicio, para proporcionarte las funciones y funcionalidades del Servicio, para comunicarnos contigo y para procesar tus transacciones.</p>

                <h3 className="font-semibold text-foreground pt-4">3. Seguridad de tus Datos</h3>
                <p>Utilizamos medidas de seguridad administrativas, técnicas y físicas para proteger tu información personal. Si bien hemos tomado medidas razonables para proteger la información personal que nos proporcionas, ten en cuenta que ninguna medida de seguridad es perfecta o impenetrable.</p>

                <h3 className="font-semibold text-foreground pt-4">4. Tus Derechos</h3>
                <p>Tienes derecho a acceder, actualizar o eliminar la información que tenemos sobre ti. Siempre que sea posible, puedes acceder, actualizar o solicitar la eliminación de tus datos personales directamente dentro de la sección de configuración de tu cuenta.</p>
                
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
