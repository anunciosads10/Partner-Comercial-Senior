'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Loader2, 
  User, 
  MapPin, 
  Award, 
  Calendar, 
  ShieldCheck, 
  ChevronLeft,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

/**
 * @fileOverview Perfil Público de un Partner.
 * Permite visualizar la información de un socio desde un enlace externo.
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
      <div className="flex items-center justify-center min-h-screen bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/30 p-4 text-center">
        <h1 className="text-4xl font-black text-primary mb-2">404</h1>
        <p className="text-muted-foreground mb-6">El perfil del socio solicitado no existe o ha sido desactivado.</p>
        <Link href="/">
          <Button variant="outline"><ChevronLeft className="mr-2 h-4 w-4" /> Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ChevronLeft className="mr-2 h-4 w-4" /> Portal PartnerVerse
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Enlace copiado al portapapeles");
          }}>
            <Share2 className="mr-2 h-4 w-4" /> Compartir Perfil
          </Button>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <div className="h-32 bg-primary relative">
            <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full shadow-lg">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
          </div>
          <CardHeader className="pt-16 pb-4 px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-3xl font-black uppercase tracking-tight text-primary">
                  {partner.name}
                </CardTitle>
                <CardDescription className="text-lg font-medium">
                  Socio Comercial Verificado
                </CardDescription>
              </div>
              <Badge variant="default" className="text-sm px-4 py-1 rounded-full bg-accent hover:bg-accent/90">
                {partner.status === 'Active' ? 'Certificado' : 'En Revisión'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-primary/5">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Territorio</span>
                  <span className="font-bold text-sm">{partner.pais || 'Global'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-primary/5">
                <Award className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Nivel</span>
                  <span className="font-bold text-sm">{partner.tier || 'Silver'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-primary/5">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Miembro desde</span>
                  <span className="font-bold text-sm">
                    {partner.joinDate ? new Date(partner.joinDate).toLocaleDateString() : 'Reciente'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" /> Credenciales y Garantías
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Este socio cuenta con el respaldo oficial de <strong>PartnerVerse</strong> para la distribución y consultoría de soluciones SaaS de alta gama. Su trayectoria y nivel <strong>{partner.tier}</strong> garantizan un servicio de excelencia y cumplimiento de los más altos estándares operativos.
              </p>
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <h4 className="font-bold text-primary mb-2 text-sm uppercase">Certificación de Integridad</h4>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">• Verificación de identidad completada</li>
                  <li className="flex items-center gap-2">• Cumplimiento de políticas antifraude v1.2</li>
                  <li className="flex items-center gap-2">• Autorización para gestión de licencias corporativas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            &copy; 2024 PartnerVerse Ecosystem - Seguridad Verificada
          </p>
        </div>
      </div>
    </div>
  );
}
