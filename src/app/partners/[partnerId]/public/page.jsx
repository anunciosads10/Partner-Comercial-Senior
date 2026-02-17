'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '../../../firebase';
import { doc } from 'firebase/firestore';
import { 
  Loader2, 
  Award, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Globe, 
  Mail,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';

/**
 * @fileOverview Página de Perfil Público del Partner.
 * Proporciona una vista de aterrizaje profesional para socios certificados.
 */

export default function PartnerPublicProfile() {
  const params = useParams();
  const partnerId = params.partnerId;
  const firestore = useFirestore();

  const partnerRef = useMemoFirebase(() => {
    if (!firestore || !partnerId) return null;
    return doc(firestore, 'partners', partnerId);
  }, [firestore, partnerId]);

  const { data: partner, isLoading } = useDoc(partnerRef);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Validando credenciales del socio...</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <ShieldCheck className="h-16 w-16 text-destructive/20 mb-4" />
        <h1 className="text-2xl font-black uppercase text-primary">Socio No Identificado</h1>
        <p className="text-muted-foreground max-w-md mt-2">La página que buscas no existe o el socio ha sido revocado del programa PartnerVerse.</p>
        <Button className="mt-8" onClick={() => window.location.href = '/'}>Volver al Inicio</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10">
      {/* Header Corporativo */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Zap className="h-6 w-6 text-primary" />
             <span className="font-black text-xl tracking-tighter text-primary">PARTNERVERSE</span>
          </div>
          <Badge variant="outline" className="border-primary/20 text-primary font-bold uppercase text-[10px]">Certificación Oficial</Badge>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="grid gap-8 md:grid-cols-3">
          
          {/* Perfil del Socio */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border-primary/10 shadow-xl overflow-hidden">
              <div className="h-24 bg-primary relative">
                <div className="absolute -bottom-10 left-6">
                  <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-primary uppercase">
                    {partner.name?.slice(0,1)}
                  </div>
                </div>
              </div>
              <CardContent className="pt-14 pb-8 px-6">
                <h1 className="text-2xl font-black text-primary uppercase tracking-tight">{partner.name}</h1>
                <p className="text-sm text-muted-foreground font-medium mb-4">{partner.email}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-accent text-white font-bold border-none">{partner.tier || 'Silver'}</Badge>
                  <Badge variant="secondary" className="uppercase font-bold text-[9px]">{partner.status}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase font-bold text-muted-foreground tracking-widest">Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">{partner.pais || 'Global Territory'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-muted-foreground">Socio desde {partner.joinDate ? new Date(partner.joinDate).getFullYear() : '2024'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">partnerverse.io/{partner.id}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalles y Validación */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-primary/10 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Award className="h-32 w-32" />
               </div>
               <h2 className="text-3xl font-black text-primary uppercase mb-4 tracking-tighter">Socio Comercial Senior</h2>
               <p className="text-muted-foreground leading-relaxed text-lg italic">
                 "Comprometido con la transformación digital del ecosistema SaaS. Facilitamos la integración de soluciones de software de clase mundial en diversos territorios."
               </p>
               <Separator className="my-8" />
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Certificación</p>
                    <p className="text-sm font-bold text-primary">Avalada por PartnerVerse</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Especialidad</p>
                    <p className="text-sm font-bold text-primary">SaaS Enterprise</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Nivel de Red</p>
                    <p className="text-sm font-bold text-primary">Multinivel Senior</p>
                  </div>
               </div>
            </div>

            <Card className="border-accent/10 bg-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent">
                  <ShieldCheck className="h-5 w-5" /> Verificar Socio
                </CardTitle>
                <CardDescription>Este perfil ha sido verificado mediante firma criptográfica y validación de identidad.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                 <Button className="bg-accent hover:bg-accent/90 text-white font-bold gap-2">
                   <Mail className="h-4 w-4" /> Contactar Socio
                 </Button>
                 <Button variant="outline" className="border-accent text-accent font-bold">Ver Credenciales</Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <footer className="container mx-auto px-6 py-12 border-t mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-muted-foreground font-medium">© 2024 PartnerVerse Ecosystem. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <span className="text-xs font-bold text-primary uppercase cursor-pointer hover:underline">Términos</span>
            <span className="text-xs font-bold text-primary uppercase cursor-pointer hover:underline">Privacidad</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
