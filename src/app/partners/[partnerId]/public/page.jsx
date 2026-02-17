'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Loader2, 
  Award, 
  Globe, 
  Mail, 
  Calendar,
  ShieldCheck,
  Briefcase,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

/**
 * @fileOverview Perfil Público de un Socio PartnerVerse.
 * Muestra las credenciales y el estatus oficial del partner a terceros.
 */
export default function PublicPartnerProfile() {
  const { partnerId } = useParams();
  const firestore = useFirestore();

  const partnerRef = useMemoFirebase(() => {
    if (!firestore || !partnerId) return null;
    return doc(firestore, 'partners', partnerId);
  }, [firestore, partnerId]);

  const { data: partner, isLoading } = useDoc(partnerRef);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center p-4 bg-secondary/30">
        <ShieldCheck className="h-20 w-20 text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold">Perfil No Encontrado</h1>
        <p className="text-muted-foreground">Este ID de socio no existe o su perfil es privado.</p>
        <Button className="mt-4" onClick={() => window.location.href = '/'}>Volver al Inicio</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Header de Verificación */}
        <div className="bg-primary p-6 rounded-t-2xl text-primary-foreground flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <Globe className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">{partner.name}</h1>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Socio Comercial Verificado por PartnerVerse
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-accent text-accent-foreground font-black px-4 py-1 text-sm uppercase">
            {partner.tier || 'Silver Member'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Info Rápida */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Territorio Oficial</p>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Star className="h-3 w-3 text-primary" /> {partner.pais || 'Global'}
                  </p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Miembro Desde</p>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-primary" /> {partner.joinDate || '2024'}
                  </p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Estatus Operativo</p>
                  <Badge className={partner.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}>
                    {partner.status === 'Active' ? 'EN OPERACIÓN' : 'INACTIVO'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full gap-2 font-bold" variant="outline">
              <Mail className="h-4 w-4" /> Contactar Socio
            </Button>
          </div>

          {/* Columna Derecha: Detalles y Especialidades */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" /> Perfil Profesional
                </CardTitle>
                <CardDescription>Resumen de capacidades y acreditaciones comerciales.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  Socio Senior con certificación en soluciones SaaS para gestión empresarial. 
                  Especializado en la implementación estratégica de herramientas tecnológicas 
                  en {partner.pais || 'territorios de alta demanda'}.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl border border-dashed flex items-start gap-3">
                    <Award className="h-5 w-5 text-accent shrink-0" />
                    <div>
                      <p className="text-xs font-bold uppercase">Expertise Gold</p>
                      <p className="text-[10px] text-muted-foreground">Estratega de canales de venta</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl border border-dashed flex items-start gap-3">
                    <Award className="h-5 w-5 text-accent shrink-0" />
                    <div>
                      <p className="text-xs font-bold uppercase">Soporte Técnico</p>
                      <p className="text-[10px] text-muted-foreground">Certificado en despliegue SaaS</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Footer de Credibilidad */}
        <div className="text-center space-y-2 py-8">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
            Sello de Garantía PartnerVerse &copy; 2024
          </p>
          <div className="flex justify-center gap-4 opacity-30">
             <ShieldCheck className="h-6 w-6" />
             <Globe className="h-6 w-6" />
             <Award className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
