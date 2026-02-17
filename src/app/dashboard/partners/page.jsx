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
  ShieldAlert,
  Calendar,
  Mail,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  X
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '../../../components/ui/dialog';
import { Separator } from '../../../components/ui/separator';
import { updateDocumentNonBlocking } from '../../../firebase/non-blocking-updates';
import { useToast } from '../../../hooks/use-toast';

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

        <Card className="md:col-span-2 border-primary/10 shadow-sm">
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
  const [selectedPartner, setSelectedPartner] = React.useState(null);
  
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

  const handleSuspend = (partnerId) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'partners', partnerId);
    updateDocumentNonBlocking(docRef, { status: 'Suspended' });
    toast({
      variant: "destructive",
      title: "Cuenta Suspendida",
      description: "El socio ha sido suspendido por políticas de cumplimiento.",
    });
  };

  /**
   * Cierra el modal y restaura la interacción del body para evitar el UI Freeze.
   */
  const closeDetails = React.useCallback(() => {
    setSelectedPartner(null);
    setTimeout(() => {
      if (typeof document !== 'undefined') {
        document.body.style.pointerEvents = '';
        document.body.style.overflow = '';
      }
    }, 100);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
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
                        <Badge 
                          variant={partner.status === 'Active' ? 'default' : partner.status === 'Suspended' ? 'destructive' : 'secondary'} 
                          className="text-[10px] uppercase min-w-[65px] justify-center"
                        >
                          {partner.status}
                        </Badge>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-56"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <DropdownMenuLabel>Gestión de Socio</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onSelect={(e) => {
                              e.preventDefault();
                              // Desacoplar eventos para evitar el bloqueo de UI
                              setTimeout(() => setSelectedPartner(partner), 150);
                            }}
                          >
                            <Info className="h-4 w-4 text-primary" /> Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onSelect={(e) => {
                              e.preventDefault();
                              toast({ title: "Enlace Generado", description: "Accediendo al perfil público..." });
                            }}
                          >
                            <ExternalLink className="h-4 w-4 text-accent" /> Perfil Público
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-destructive focus:text-destructive cursor-pointer font-bold"
                            onSelect={(e) => {
                              e.preventDefault();
                              handleSuspend(partner.id);
                            }}
                          >
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

      <Dialog 
        open={!!selectedPartner} 
        onOpenChange={(open) => {
          if (!open) closeDetails();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Detalles del Socio</DialogTitle>
                <DialogDescription>Información técnica y administrativa del partner.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedPartner && (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Correo Electrónico
                  </p>
                  <p className="text-sm font-medium">{selectedPartner.email}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Nivel Actual</p>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary">
                    {selectedPartner.tier}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Territorio
                  </p>
                  <p className="text-sm font-medium">{selectedPartner.pais || 'Sin Asignar'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3" /> Fecha de Ingreso
                  </p>
                  <p className="text-sm font-medium">
                    {selectedPartner.joinDate ? new Date(selectedPartner.joinDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Estado del Sistema</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedPartner.status === 'Active' ? (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    ) : (
                      <AlertOctagon className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm font-black uppercase">{selectedPartner.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">ID Interno</p>
                  <p className="text-[10px] font-mono mt-1 opacity-50">{selectedPartner.id}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={closeDetails}>Cerrar Ventana</Button>
            <Button onClick={closeDetails}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
