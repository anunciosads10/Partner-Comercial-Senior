'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '../../../components/authenticated-layout';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '../../../firebase';
import { doc, collection } from 'firebase/firestore';
import { 
  Loader2, 
  ExternalLink, 
  Award, 
  Globe, 
  Users as UsersIcon,
  MoreHorizontal,
  Info,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../../../components/ui/dropdown-menu';
import { Switch } from '../../../components/ui/switch';
import { updateDocumentNonBlocking } from '../../../firebase/non-blocking-updates';
import { useToast } from '../../../hooks/use-toast';

/**
 * @fileOverview Vista de Partners con rutas relativas para producción.
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
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Mi Estatus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nivel:</span>
              <Badge variant="secondary">{userData?.tier || 'Silver'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Territorio:</span>
              <span className="text-sm">{userData?.pais || 'Global'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Plataformas Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SaaS</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms?.map((platform) => (
                  <TableRow key={platform.id}>
                    <TableCell className="font-semibold">{platform.name}</TableCell>
                    <TableCell>{platform.baseCommission}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Enlace</Button>
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
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const partnersRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'partners');
  }, [firestore, user?.uid]);

  const { data: partners, isLoading } = useCollection(partnersRef);

  const handleToggleStatus = (partnerId, currentStatus) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const docRef = doc(firestore, 'partners', partnerId);
    
    updateDocumentNonBlocking(docRef, { status: newStatus });
    
    toast({
      title: "Estado Actualizado",
      description: `El socio ha sido ${newStatus === 'Active' ? 'activado' : 'desactivado'} exitosamente.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-primary/10 shadow-sm">
      <CardHeader>
        <CardTitle>Gestión Global de Partners</CardTitle>
        <CardDescription>Panel de control para la activación y supervisión de la red de socios.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Socio</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Estado y Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners?.map((partner) => (
              <TableRow key={partner.id} className="hover:bg-muted/20 transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{partner.name}</span>
                    <span className="text-[10px] text-muted-foreground">{partner.email}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{partner.pais || 'No asignado'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {partner.tier}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={partner.status === 'Active'} 
                        onCheckedChange={() => handleToggleStatus(partner.id, partner.status)}
                      />
                      <Badge variant={partner.status === 'Active' ? 'default' : 'destructive'} className="text-[10px] uppercase min-w-[65px] justify-center">
                        {partner.status}
                      </Badge>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Gestión de Socio</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Info className="h-4 w-4" /> Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <ExternalLink className="h-4 w-4" /> Perfil Público
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer">
                          <ShieldAlert className="h-4 w-4" /> Suspender Cuenta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
            <UsersIcon className="h-8 w-8" /> Partners
          </h1>
          <p className="text-muted-foreground text-sm">Administración de la red de socios y plataformas afiliadas.</p>
        </div>
        {isSuperAdmin ? <SuperAdminPartnersView /> : <AdminPartnersView userData={userData} />}
      </div>
    </AuthenticatedLayout>
  );
}
