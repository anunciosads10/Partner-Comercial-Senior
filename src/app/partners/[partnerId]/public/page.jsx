'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Loader2, 
  ArrowLeft, 
  Globe, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Award,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

/**
 * @fileOverview Vista Pública del Perfil del Partner.
 * Proporciona una página de aterrizaje profesional para la validación de socios.
 */
export default function PublicPartnerProfile() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const partnerId = params.partnerId;

  const partnerRef = useMemoFirebase(() => {
    if (!firestore || !partnerId) return null;
    return doc(firestore, 'partners', partnerId);
  }, [firestore, partnerId]);

  const { data: partner, isLoading, error } = useDoc(partnerRef);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Cargando perfil oficial...</p>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-6">
          <ShieldCheck className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Socio No Encontrado</h1>
        <p className="text-muted-foreground max-w-md mb-8">El perfil solicitado no existe o ha sido revocado del programa PartnerVerse.</p>
        <Button onClick={() => router.back()} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver atrás
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al portal
        </Button>

        <Card className="border-primary/10 shadow-2xl overflow-hidden border-t-4 border-t-primary bg-white">
          <CardHeader className="pb-8 pt-10 px-8 bg-muted/5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest px-3">Socio Certificado</Badge>
                  {partner.status === 'Active' && (
                    <div className="flex items-center gap-1.5 text-accent text-[10px] font-black uppercase tracking-tighter">
                      <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                      Activo
                    </div>
                  )}
                </div>
                <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">{partner.name}</h1>
                <CardDescription className="text-lg font-medium">Socio Comercial Senior PartnerVerse</CardDescription>
              </div>
              <div className="shrink-0">
                <div className="h-24 w-24 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-inner">
                  <Award className="h-12 w-12 text-primary" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Globe className="h-5 w-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Territorio Oficial</span>
                    <span className="text-foreground font-black uppercase">{partner.pais || 'Territorio Global'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-5 w-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Contacto de Negocios</span>
                    <span className="text-foreground font-bold">{partner.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Award className="h-5 w-5 text-accent" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Nivel de Alianza</span>
                    <Badge variant="outline" className="w-fit border-accent/20 text-accent font-black uppercase tracking-widest">
                      {partner.tier || 'Silver'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Socio desde</span>
                    <span className="text-foreground font-bold">{partner.joinDate ? new Date(partner.joinDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Verificación de Integridad</h3>
              <div className="bg-accent/5 border border-accent/10 rounded-xl p-6 flex items-start gap-4">
                <ShieldCheck className="h-6 w-6 text-accent shrink-0 mt-1" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-accent uppercase tracking-tight">Identidad Validada</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Este socio ha completado satisfactoriamente los protocolos de cumplimiento (Compliance) y está autorizado para comercializar soluciones SaaS de la red PartnerVerse en su territorio asignado.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <Button className="flex-1 gap-2 font-black uppercase tracking-tight py-6">
                Contactar Socio <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="flex-1 gap-2 font-black uppercase tracking-tight py-6">
                Validar Licencia
              </Button>
            </div>
          </CardContent>
          
          <div className="bg-primary p-4 text-center">
            <p className="text-[10px] text-primary-foreground font-bold uppercase tracking-[0.2em] opacity-80">
              Certificación Oficial PartnerVerse ID: {partner.id}
            </p>
          </div>
        </Card>

        <footer className="text-center space-y-2 pb-12">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Powered by PartnerVerse Intelligence Platform</p>
          <div className="flex justify-center gap-4">
            <span className="h-1 w-8 bg-primary/20 rounded-full" />
            <span className="h-1 w-8 bg-accent/20 rounded-full" />
            <span className="h-1 w-8 bg-primary/20 rounded-full" />
          </div>
        </footer>
      </div>
    </div>
  );
}
