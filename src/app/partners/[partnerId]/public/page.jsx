'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '../../../firebase';
import { doc } from 'firebase/firestore';
import { 
  Loader2, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Mail, 
  Globe, 
  Award,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';

/**
 * @fileOverview Perfil Público de Partner.
 * Proporciona una ficha técnica veríficable para terceros y clientes.
 */
export default function PublicPartnerProfile() {
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <h1 className="text-4xl font-black text-primary">404</h1>
        <p className="text-muted-foreground font-medium">Socio no encontrado en la red PartnerVerse.</p>
        <Link href="/">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        <Card className="border-primary/10 shadow-xl overflow-hidden">
          <div className="h-32 bg-primary flex items-end px-8 pb-4 relative">
             <div className="absolute top-4 left-4">
               <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md font-black uppercase text-[10px]">
                 Perfil Verificado Oficial
               </Badge>
             </div>
          </div>
          <CardHeader className="pt-16 relative">
            <div className="absolute -top-16 left-8 h-24 w-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
               <Award className="h-12 w-12 text-primary" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-3xl font-black uppercase tracking-tight text-primary">{partner.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 font-medium mt-1 uppercase text-[10px]">
                  <ShieldCheck className="h-4 w-4 text-accent" /> Socio PartnerVerse Nivel {partner.tier || 'Silver'}
                </CardDescription>
              </div>
              <Badge variant="default" className="w-fit text-[10px] py-1 px-4 bg-accent font-black uppercase">
                ESTADO: {partner.status === 'Active' ? 'ACTIVO' : 'EN REVISIÓN'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-primary/5">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Ubicación</span>
                  <span className="text-sm font-semibold">{partner.pais || 'Global'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-primary/5">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Desde</span>
                  <span className="text-sm font-semibold">{partner.joinDate ? new Date(partner.joinDate).toLocaleDateString() : 'Reciente'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-primary/5">
                <Globe className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Territorio</span>
                  <span className="text-sm font-semibold">Autorizado</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
               <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                 <Mail className="h-5 w-5 text-primary" /> Contacto Oficial
               </h3>
               <p className="text-sm text-muted-foreground bg-muted/30 p-6 rounded-xl border border-dashed border-primary/20 leading-relaxed">
                 Este socio comercial está debidamente acreditado por la red <span className="text-primary font-black">PartnerVerse</span> para la distribución, consultoría técnica y asesoría de soluciones SaaS en su territorio. 
                 <br /><br />
                 Para consultas comerciales directas o validación de credenciales, puede contactar a través de: <span className="text-primary font-bold bg-white px-2 py-0.5 rounded border">{partner.email}</span>
               </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">© 2024 PartnerVerse Global Network • Trusted Partner Program</p>
          <Link href="/">
             <Button variant="ghost" size="sm" className="text-xs font-bold gap-2">
               <ArrowLeft className="h-3 w-3" /> Volver a PartnerVerse
             </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
