'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Loader2, 
  Globe, 
  Award, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  TrendingUp, 
  UserCheck 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

/**
 * @fileOverview Perfil Público del Partner.
 * Muestra la información de afiliación y estatus de un socio comercial.
 */
export default function PartnerPublicProfilePage() {
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Cargando perfil verificado...</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center space-y-4">
        <ShieldCheck className="h-16 w-16 text-muted-foreground/20" />
        <h1 className="text-2xl font-black uppercase text-primary">Socio no Encontrado</h1>
        <p className="text-muted-foreground max-w-md">La credencial solicitada no existe o no se encuentra activa en nuestro ecosistema SaaS.</p>
        <Link href="/">
          <Button variant="outline">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-primary uppercase">{partner.name}</h1>
          <p className="text-muted-foreground font-medium flex items-center justify-center gap-2">
             Partner Comercial Senior <UserCheck className="h-4 w-4 text-accent" />
          </p>
        </div>

        <Card className="border-primary/10 shadow-2xl overflow-hidden bg-white">
          <CardHeader className="bg-primary text-primary-foreground p-8 text-center">
            <div className="flex justify-center mb-4">
              <Badge className="bg-white text-primary hover:bg-white text-xs font-black uppercase px-4 py-1">
                Socio Verificado
              </Badge>
            </div>
            <CardTitle className="text-2xl uppercase tracking-widest font-black">Certificado de Afiliación</CardTitle>
            <CardDescription className="text-primary-foreground/80 font-medium">
              Estatus oficial en la red global PartnerVerse
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Nivel de Partner</p>
                    <p className="text-lg font-black text-primary uppercase">{partner.tier || 'Silver'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Contacto Oficial</p>
                    <p className="text-sm font-semibold">{partner.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Territorio Asignado</p>
                    <p className="text-lg font-black text-primary uppercase">{partner.pais || 'Territorio Global'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Estado de Operación</p>
                    <Badge variant={partner.status === 'Active' ? 'default' : 'destructive'} className="uppercase font-black">
                      {partner.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-primary/10" />

            <div className="bg-muted/30 p-6 rounded-xl border-2 border-dashed border-primary/20 text-center space-y-2">
               <ShieldCheck className="h-10 w-10 text-primary/40 mx-auto" />
               <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
                 Este perfil es una representación digital del contrato de afiliación vigente. PartnerVerse garantiza la integridad de los datos aquí mostrados mediante sincronización en tiempo real con nuestro motor SaaS centralizado.
               </p>
               <p className="text-[10px] font-bold text-primary/60">ID: {partner.id}</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">
              Desarrollado por PartnerVerse &copy; 2024
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
