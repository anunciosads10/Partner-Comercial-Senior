'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Loader2, 
  User, 
  MapPin, 
  Calendar, 
  Award, 
  ShieldCheck, 
  Globe, 
  Mail 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

/**
 * @fileOverview Página de Perfil Público de un Partner.
 * Proporciona una vista de solo lectura para validación externa de socios.
 */
export default function PublicPartnerProfilePage() {
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-6">
        <h1 className="text-4xl font-black text-primary mb-4 uppercase">404 - No Encontrado</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          El perfil de socio solicitado no existe o no tiene una ficha pública activa en nuestro ecosistema.
        </p>
        <Link href="/">
          <Button variant="outline">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white shadow-xl">
            <User className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{partner.name}</h1>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="font-bold uppercase tracking-wider text-[10px]">
                {partner.tier || 'Silver'} Partner
              </Badge>
              <Badge variant={partner.status === 'Active' ? 'default' : 'destructive'} className="font-black uppercase text-[10px]">
                {partner.status}
              </Badge>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground p-8">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <CardTitle className="text-xl font-black uppercase tracking-widest">Socio Verificado</CardTitle>
            </div>
            <CardDescription className="text-primary-foreground/80 font-medium">
              Esta credencial certifica que {partner.name} es un socio comercial activo dentro de la red PartnerVerse.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg"><Mail className="h-4 w-4 text-slate-500" /></div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Contacto Oficial</p>
                    <p className="text-sm font-semibold text-slate-900">{partner.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg"><MapPin className="h-4 w-4 text-slate-500" /></div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Territorio de Operación</p>
                    <p className="text-sm font-semibold text-slate-900">{partner.pais || 'Global'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg"><Calendar className="h-4 w-4 text-slate-500" /></div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Miembro desde</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {partner.joinDate ? new Date(partner.joinDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg"><Award className="h-4 w-4 text-slate-500" /></div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Nivel de Alianza</p>
                    <p className="text-sm font-semibold text-slate-900">{partner.tier || 'Silver'}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-4">
              <Globe className="h-10 w-10 text-slate-300" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verificación PartnerVerse</p>
                <p className="text-[10px] text-slate-500 font-mono">ID: {partner.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center space-y-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            &copy; 2024 PartnerVerse - Todos los derechos reservados.
          </p>
          <Link href="/">
            <Button variant="ghost" className="text-xs text-primary font-black uppercase">
              Volver a la Plataforma
            </Button>
          </Link>
        </footer>
      </div>
    </div>
  );
}
