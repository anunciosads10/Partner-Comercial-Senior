'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Loader2, ExternalLink, Award, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * @fileOverview Vista de Partners optimizada para Producción.
 * Resuelve el error de referencia de componentes y maneja roles de usuario.
 */

function AdminPartnersView({ userData }) {
  const firestore = useFirestore();
  const platformsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'saasPlatforms');
  }, [firestore]);

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
        <Card className="md:col-span-1 shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">Mi Perfil de Socio</CardTitle>
            <CardDescription>Nivel y territorio asignado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nivel:</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Award className="mr-1 h-3 w-3" /> {userData?.tier || 'Silver'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">País:</span>
              <span className="text-sm flex items-center gap-1">
                <Globe className="h-3 w-3" /> {userData?.pais || 'No especificado'}
              </span>
            </div>
            <div className="pt-4 border-t text-xs text-muted-foreground italic">
              Unido el: {userData?.joinDate ? new Date(userData.joinDate).toLocaleDateString() : 'Pendiente'}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Mis Enlaces de Afiliado</CardTitle>
            <CardDescription>Usa estos enlaces para referir clientes y ganar comisiones.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
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
                        <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary hover:bg-primary/5">
                          Copiar <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                      No hay plataformas disponibles en este momento.
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
  const firestore = useFirestore();
  const partnersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'partners');
  }, [firestore]);

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
        <CardTitle className="text-xl font-bold">Gestión Global de Partners</CardTitle>
        <CardDescription>Control centralizado de la red de socios comerciales.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nombre</TableHead>
              <TableHead>País</TableHead>
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
                  <Badge variant="outline" className="capitalize">{partner.tier}</Badge>
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
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

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
          <h1 className="text-3xl font-black tracking-tight text-primary">Partners</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin 
              ? 'Administración centralizada de socios comerciales.' 
              : 'Panel de gestión para Socios Comerciales Senior.'}
          </p>
        </div>

        {isSuperAdmin ? <SuperAdminPartnersView /> : <AdminPartnersView userData={userData} />}
      </div>
    </AuthenticatedLayout>
  );
}
