'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Loader2, ExternalLink, Award, Globe, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * @fileOverview Vista de Partners para Producción.
 * Resuelve errores de referencia e implementa lógica por rol.
 */

function AdminPartnersView({ userData }) {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const platformsRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'saasPlatforms');
  }, [firestore, user?.uid]);

  const { data: platforms, isLoading } = useCollection(platformsRef);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mi Estatus</CardTitle>
            <CardDescription>Resumen de socio comercial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nivel:</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Award className="mr-1 h-3 w-3" /> {userData?.tier || 'Silver'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Territorio:</span>
              <span className="text-sm flex items-center gap-1">
                <Globe className="h-3 w-3 text-accent" /> {userData?.pais || 'Sin asignar'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Plataformas de Afiliación</CardTitle>
            <CardDescription>Enlaces directos para referir nuevos clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Producto SaaS</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead className="text-right">Enlace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms && platforms.length > 0 ? (
                  platforms.map((platform) => (
                    <TableRow key={platform.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold">{platform.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-accent border-accent">
                          {platform.baseCommission || 0}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-2 text-primary">
                          Copiar <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground italic">
                      No hay plataformas asignadas todavía.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SuperAdminPartnersView() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const partnersRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'partners');
  }, [firestore, user?.uid]);

  const { data: partners, isLoading } = useCollection(partnersRef);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader>
        <div className="flex items-center gap-3">
            <UsersIcon className="h-6 w-6 text-primary" />
            <div>
                <CardTitle className="text-xl font-bold">Gestión de Red Comercial</CardTitle>
                <CardDescription>Control total de socios comerciales en todos los territorios.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nombre</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners?.map((partner) => (
              <TableRow key={partner.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>{partner.pais}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize border-primary/20 text-primary">{partner.tier}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={partner.status === 'Active' ? 'default' : 'destructive'}>
                    {partner.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function PartnersPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading } = useDoc(userDocRef);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const isSuperAdmin = userData?.role === 'superadmin';

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase">Socios</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin 
              ? 'Administración global de la red PartnerVerse.' 
              : 'Gestión de perfil y herramientas de afiliado.'}
          </p>
        </div>

        {isSuperAdmin ? <SuperAdminPartnersView /> : <AdminPartnersView userData={userData} />}
      </div>
    </AuthenticatedLayout>
  );
}
