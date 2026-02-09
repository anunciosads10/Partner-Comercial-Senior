'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Loader2, Users, ExternalLink, Award, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function AdminPartnersView({ userData }) {
  const firestore = useFirestore();
  const platformsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'saasPlatforms');
  }, [firestore]);

  const { data: platforms, isLoading } = useCollection(platformsRef);

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Mi Perfil de Socio</CardTitle>
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
            <div className="pt-4 border-t text-xs text-muted-foreground">
              Unido el: {userData?.joinDate ? new Date(userData.joinDate).toLocaleDateString() : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Mis Enlaces de Afiliado</CardTitle>
            <CardDescription>Usa estos enlaces para referir clientes y ganar comisiones.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms?.map((platform) => (
                  <TableRow key={platform.id}>
                    <TableCell className="font-medium">{platform.name}</TableCell>
                    <TableCell>{platform.baseCommission || 0}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-2">
                        Copiar Enlace <ExternalLink className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-10" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión Global de Partners</CardTitle>
        <CardDescription>Listado y administración de todos los socios comerciales.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners?.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>{partner.pais}</TableCell>
                <TableCell>
                  <Badge variant="outline">{partner.tier}</Badge>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partners</h1>
            <p className="text-muted-foreground">
              {isSuperAdmin 
                ? 'Administración central de la red de socios comerciales.' 
                : 'Tu panel personal de gestión como Socio Comercial Senior.'}
            </p>
          </div>
        </div>

        {isSuperAdmin ? <SuperAdminPartnersView /> : <AdminPartnersView userData={userData} />}
      </div>
    </AuthenticatedLayout>
  );
}
