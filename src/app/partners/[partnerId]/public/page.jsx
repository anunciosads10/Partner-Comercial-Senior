'use client';

import * as React from 'react';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { 
  Users, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Globe, 
  Award,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

/**
 * @fileOverview Página de Perfil Público de Partner.
 * Accesible sin autenticación administrativa para validación de socios.
 */
export default function PartnerPublicProfile() {
  const { partnerId } = useParams();
  const firestore = useFirestore();

  const partnerRef = useMemoFirebase(() => {
    if (!firestore || !partnerId) return null;
    return doc(firestore, 'partners', partnerId);
  }, [firestore, partnerId]);

  const { data: partner, isLoading } = useDoc(partnerRef);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Validando Credenciales...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50 p-4 text-center">
        <h1 className="text-6xl font-black text-primary/20">404</h1>
        <h2 className="text-2xl font-bold uppercase tracking-tight">Socio no Encontrado</h2>
        <p className="text-muted-foreground max-w-md">La identificación proporcionada no corresponde a un partner activo en el sistema PartnerVerse.</p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-bold text-primary hover:underline gap-2 uppercase tracking-tighter">
            <ArrowLeft size={14} /> Regresar a PartnerVerse
          </Link>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary">
            Perfil Verificado
          </Badge>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
          <div className="h-40 bg-gradient-to-r from-primary to-indigo-900"></div>
          <CardHeader className="relative pb-0 px-8">
            <div className="absolute -top-20 left-8">
              <div className="h-40 w-40 rounded-3xl bg-white p-3 shadow-2xl border border-slate-100">
                <div className="h-full w-full rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                  <Users size={64} className="opacity-80" />
                </div>
              </div>
            </div>
            <div className="pt-24 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8">
              <div className="space-y-1">
                <h1 className="text-4xl font-black uppercase tracking-tight text-primary leading-none">{partner.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={16} className="text-accent" />
                  <span className="text-sm font-bold uppercase tracking-tight">{partner.pais || 'Territorio Global'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className="text-xl py-2 px-6 font-black uppercase tracking-widest bg-primary text-white shadow-lg">
                  {partner.tier || 'SILVER'}
                </Badge>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Nivel de Afiliación</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-3 transition-transform hover:scale-105">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Globe className="text-accent h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Estatus Digital</span>
                  <p className="text-sm font-black text-primary">{partner.status === 'Active' ? 'OPERATIVO' : 'EN REVISIÓN'}</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-3 transition-transform hover:scale-105">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Calendar className="text-accent h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Antigüedad</span>
                  <p className="text-sm font-black text-primary">{partner.joinDate ? new Date(partner.joinDate).getFullYear() : 'N/A'}</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-3 transition-transform hover:scale-105">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <ShieldCheck className="text-accent h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Certificación</span>
                  <p className="text-sm font-black text-primary">SOCIOS SENIOR</p>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-3 space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-primary">
                    <Award className="text-accent h-7 w-7" /> Perfil de Consultoría
                  </h2>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    Este socio actúa como representante oficial y certificado de la red **PartnerVerse**. 
                    Está plenamente facultado para la distribución, asesoramiento técnico e implementación 
                    de soluciones SaaS en el ecosistema empresarial. Su gestión está auditada por nuestra 
                    central de operaciones en {partner.pais || 'el Territorio Global'}.
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <Card className="bg-primary text-white border-none rounded-2xl shadow-xl p-6">
                  <h3 className="font-black uppercase text-xs tracking-widest mb-4 opacity-70">Garantía de Servicio</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
                      <span className="text-xs font-bold leading-tight">Distribución autorizada de licencias SaaS.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
                      <span className="text-xs font-bold leading-tight">Soporte técnico de primer nivel certificado.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
                      <span className="text-xs font-bold leading-tight">Cumplimiento de normativas de transparencia.</span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center space-y-2 py-8">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">© 2024 PartnerVerse - Central de Socios Certificados</p>
          <p className="text-[9px] text-muted-foreground opacity-50">Documento de validación digital generado automáticamente por el sistema de gobernanza PartnerVerse.</p>
        </footer>
      </div>
    </div>
  );
}
