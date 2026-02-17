'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { 
  Loader2, 
  ExternalLink, 
  Users as UsersIcon,
  MoreHorizontal,
  Info,
  ShieldAlert,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Gestión de Partners con motor de limpieza de UI para prevenir bloqueos de interacción.
 */

function PartnerDetailsModal({ partner, open, onClose }) {
  if (!open || !partner) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  const handleCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b bg-muted/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
               <Info className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">Detalles del Socio</h2>
              <p className="text-sm text-muted-foreground">Ficha técnica administrativa.</p>
            </div>
          </div>
          <button
            onClick={handleCloseClick}
            type="button"
            className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Correo Electrónico</span>
              <p className="text-sm font-semibold text-foreground">{partner.email}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Nivel Actual</span>
              <div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary">
                  {partner.tier || 'Silver'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Territorio</span>
              <p className="text-sm font-semibold text-foreground">{partner.pais || 'Sin asignar'}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Fecha de Ingreso</span>
              <p className="text-sm font-semibold text-foreground">
                {partner.joinDate ? new Date(partner.joinDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/30 p-4 rounded-xl flex items-center justify-between border">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Estado del Sistema</span>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${partner.status === 'Active' ? 'bg-accent' : 'bg-destructive'}`}></div>
                <span className="text-sm font-black uppercase text-foreground">{partner.status}</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">ID Interno</span>
              <p className="text-[10px] font-mono text-muted-foreground opacity-60">{partner.id}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={handleCloseClick}>Cerrar Ventana</Button>
          <Button onClick={handleCloseClick}>Aceptar</Button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mi Estatus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nivel:</span>
              <Badge variant="secondary" className="font-bold">{userData?.tier || 'Silver'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Territorio:</span>
              <span className="text-sm font-bold">{userData?.pais || 'Global'}</span>
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
                <TableRow className="bg-muted/50">
                  <TableHead>SaaS</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms?.map((platform) => (
                  <TableRow key={platform.id} className="hover:bg-muted/20">
                    <TableCell className="font-black text-sm">{platform.name}</TableCell>
                    <TableCell className="text-primary font-bold">{platform.baseCommission}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="font-bold">Ver Enlace</Button>
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
      title: "Estado Sincronizado",
      description: `El socio ha sido ${newStatus === 'Active' ? 'activado' : 'desactivado'}.`,
    });
  };

  const handleSuspend = (partnerId) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'partners', partnerId);
    updateDocumentNonBlocking(docRef, { status: 'Suspended' });
    toast({
      variant: "destructive",
      title: "Cuenta Suspendida",
      description: "El socio ha sido revocado de forma inmediata.",
    });
  };

  /**
   * Motor de limpieza atómica para prevenir UI Freeze.
   * Fuerza la restauración de la interacción del navegador tras cerrar diálogos.
   */
  const closeDetails = React.useCallback(() => {
    setSelectedPartner(null);
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
      document.body.removeAttribute('data-scroll-locked');
    }
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
      <Card className="border-primary/10 shadow-sm animate-in fade-in duration-500">
        <CardHeader>
          <CardTitle className="uppercase font-black text-primary tracking-tight">Gestión Maestra de Partners</CardTitle>
          <CardDescription>Control de activación, suspensión y auditoría de la red.</CardDescription>
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
                      <span className="font-black text-sm uppercase tracking-tight">{partner.name}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{partner.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{partner.pais || 'Territorio Global'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-black border-primary/20 text-primary">
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
                          className="text-[10px] uppercase min-w-[75px] justify-center font-black"
                        >
                          {partner.status}
                        </Badge>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-56"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <DropdownMenuLabel className="font-black uppercase text-[10px] tracking-widest opacity-50">Auditoría de Socio</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer font-bold"
                            onSelect={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTimeout(() => setSelectedPartner(partner), 50);
                            }}
                          >
                            <Info className="h-4 w-4 text-primary" /> Ver Ficha Técnica
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer font-bold"
                            onSelect={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const publicUrl = `/partners/${partner.id}/public`;
                              window.open(publicUrl, '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4 text-accent" /> Ver Perfil Público
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-destructive focus:text-destructive cursor-pointer font-black uppercase text-[10px] tracking-tighter"
                            onSelect={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
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

      <PartnerDetailsModal 
        partner={selectedPartner} 
        open={!!selectedPartner} 
        onClose={closeDetails} 
      />
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
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
            <UsersIcon className="h-8 w-8" /> Gestión de Partners
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Administración estratégica de la red de socios comerciales.</p>
        </div>
        {isSuperAdmin ? <SuperAdminPartnersView /> : <AdminPartnersView userData={userData} />}
      </div>
    </AuthenticatedLayout>
  );
}
