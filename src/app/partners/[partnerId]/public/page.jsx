'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Loader2, 
  CheckCircle2, 
  Globe, 
  Mail, 
  Award,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function PartnerPublicProfile() {
  const params = useParams();
  const partnerId = params.partnerId;
  const firestore = useFirestore();

  const partnerDocRef = useMemoFirebase(() => {
    if (!firestore || !partnerId) return null;
    return doc(firestore, 'partners', partnerId);
  }, [firestore, partnerId]);

  const { data: partner, isLoading } = useDoc(partnerDocRef);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Cargando perfil oficial...</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4 text-center px-4">
        <div className="p-6 bg-white rounded-full shadow-sm mb-4">
          <ShieldCheck className="h-16 w-16 text-muted-foreground/30" />
        </div>
        <h1 className="text-2xl font-black uppercase text-primary">Perfil No Encontrado</h1>
        <p className="text-muted-foreground max-w-md">El socio comercial solicitado no existe o su perfil ha sido revocado del sistema.</p>
        <Link href="/">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">P</div>
              <span className="font-black text-xl tracking-tight">PartnerVerse</span>
           </div>
           <Badge variant="outline" className="border-primary/20 text-primary font-bold">Verificado Oficial</Badge>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
          <div className="h-48 bg-gradient-to-r from-primary to-accent relative">
             <div className="absolute -bottom-16 left-8">
                <div className="h-32 w-32 rounded-3xl bg-white p-2 shadow-xl">
                   <div className="h-full w-full rounded-2xl bg-muted flex items-center justify-center">
                      <Globe className="h-12 w-12 text-primary/40" />
                   </div>
                </div>
             </div>
          </div>
          
          <CardContent className="pt-20 px-8 pb-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">{partner.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium">{partner.email}</span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 px-4 py-1 text-lg font-black uppercase">
                 Tier {partner.tier || 'Silver'}
              </Badge>
            </div>

            <Separator className="bg-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ubicación</p>
                  <p className="text-lg font-black">{partner.pais || 'Global'}</p>
               </div>
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-2">
                  <Award className="h-5 w-5 text-accent" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estatus de Socio</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <p className="text-lg font-black">{partner.status || 'Activo'}</p>
                  </div>
               </div>
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-2">
                  <ShieldCheck className="h-5 w-5 text-slate-400" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Miembro Desde</p>
                  <p className="text-lg font-black">{partner.joinDate ? new Date(partner.joinDate).getFullYear() : '2024'}</p>
               </div>
            </div>

            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 text-center space-y-4">
              <h3 className="text-xl font-black text-primary uppercase">Socio de Negocios Autorizado</h3>
              <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">
                Este perfil certifica que <span className="font-bold">{partner.name}</span> es un socio comercial autorizado de la red PartnerVerse, operando bajo los estándares de transparencia y excelencia de nuestra plataforma global.
              </p>
              <Button className="font-black uppercase tracking-widest rounded-full px-10 bg-primary hover:bg-primary/90">
                Contactar Socio
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
           <Link href="/" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
             <ArrowLeft className="h-4 w-4" /> Volver a PartnerVerse
           </Link>
        </div>
      </div>
    </div>
  );
}
