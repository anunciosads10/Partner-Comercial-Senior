'use client';

import * as React from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { 
  Users, 
  Globe, 
  ShieldCheck, 
  Calendar, 
  ArrowLeft,
  Mail,
  Award,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

/**
 * @fileOverview Perfil Público de un Partner.
 * Muestra la información de acreditación oficial para clientes y prospectos.
 */
export default function PublicPartnerProfile() {
  const params = useParams();
  const partnerId = params?.partnerId;
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-4">
        <h1 className="text-4xl font-black text-primary mb-4">404</h1>
        <p className="text-muted-foreground mb-8">El perfil de socio solicitado no existe o no es público.</p>
        <Link href="/">
          <Button variant="default">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Salir de vista pública
            </Button>
          </Link>
          <Badge variant="outline" className="bg-white border-primary/20 text-primary font-bold px-4 py-1">
            PERFIL VERIFICADO
          </Badge>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <div className="h-32 bg-primary"></div>
          <CardHeader className="relative pt-16 text-center">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tight text-primary">
              {partner.name}
            </CardTitle>
            <CardDescription className="flex items-center justify-center gap-2 mt-2">
              <Globe className="h-4 w-4" /> Socio Autorizado de PartnerVerse
            </CardDescription>
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="default" className="uppercase font-black px-4">
                Tier {partner.tier || 'Silver'}
              </Badge>
              <Badge variant="secondary" className="uppercase font-bold">
                {partner.pais || 'Global'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30">
                <ShieldCheck className="h-8 w-8 text-accent mb-2" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Estatus</span>
                <p className="text-sm font-black text-foreground uppercase">{partner.status}</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30">
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Miembro desde</span>
                <p className="text-sm font-black text-foreground">{partner.joinDate ? new Date(partner.joinDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30">
                <Award className="h-8 w-8 text-yellow-600 mb-2" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Verificación</span>
                <p className="text-sm font-black text-foreground uppercase">Oficial</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-tight text-primary flex items-center gap-2">
                <Mail className="h-5 w-5" /> Información de Contacto
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Este socio comercial está plenamente capacitado para ofrecer consultoría y servicios sobre las plataformas SaaS afiliadas a PartnerVerse. Para validar la autenticidad de este certificado, puede contactar directamente con nuestro departamento de soporte.
              </p>
              <div className="bg-slate-100 p-4 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                 <p className="text-sm font-mono font-bold text-primary">{partner.email}</p>
              </div>
            </div>
          </CardContent>
          <div className="p-4 bg-muted/10 text-center border-t">
            <p className="text-[10px] text-muted-foreground font-medium">
              &copy; 2024 PartnerVerse - Todos los derechos reservados. ID del Socio: {partner.id}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
