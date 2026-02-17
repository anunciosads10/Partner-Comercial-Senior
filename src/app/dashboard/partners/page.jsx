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
  X,
  UserPlus,
  Save
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

function PartnerDetailsModal({ partner, open, onClose }) {
  if (!open || !partner) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"
      onClick={onClose}
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
              <p className="text-sm text-gray-500">Ficha técnica administrativa del partner.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Correo Electrónico</span>
              <p className="text-sm font-semibold">{partner.email}</p>
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

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Territorio</span>
              <p className="text-sm font-semibold">{partner.pais || 'Sin asignar'}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Fecha de Ingreso</span>
              <p className="text-sm font-semibold">
                {partner.joinDate || 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/30 p-4 rounded-xl flex items-center justify-between border">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Estado del Sistema</span>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${partner.status === 'Active' ? 'bg-green-500' : 'bg-destructive'}`}></div>
                <span className="text-sm font-black uppercase">{partner.status}</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">ID Interno</span>
              <p className="text-[10px] font-mono text-muted-foreground opacity-60">{partner.id}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={onClose}>Cerrar Ventana</Button>
          <Button onClick={onClose}>Aceptar</Button>
        </div>
      </div>
    </div>
  );
}

function CreatePartnerModal({ open, onClose, firestore }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    tier: 'Silver',
    pais: '',
    status: 'Active'
  });

  if (!open) return null;

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Nombre y email son obligatorios." });
      return;
    }

    setIsSaving(true);
    const partnersCol = collection(firestore, 'partners');
    const newPartner = {
      ...formData,
      id: formData.email.replace(/[^a-zA-Z0-9]/g, '-'),
      joinDate: new Date().toISOString()
    };

    addDocumentNonBlocking(partnersCol, newPartner);
    toast({ title: "Socio Registrado", description: `${formData.name} ha sido añadido a la red.` });
    setIsSaving(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-black uppercase tracking-tight">Nuevo Socio Comercial</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:bg-muted rounded-full p-2">
            <X className="h-5 w-5"/>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej. Alexander Jiménez" />
          </div>
          <div className="space-y-2">
            <Label>Email Corporativo</Label>
            <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="m@ejemplo.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>País</Label>
              <Input value={formData.pais} onChange={(e) => setFormData({...formData, pais: e.target.value})} placeholder="Ej. Colombia" />
            </div>
            <div className="space-y-2">
              <Label>Nivel (Tier)</Label>
              <Select value={formData.tier} onValueChange={(val) => setFormData({...formData, tier: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[150]">
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Partner
          </Button>
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
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  
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

  const closeDetails = React.useCallback(() => {
    setSelectedPartner(null);
    setIsCreateOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
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
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 font-bold shadow-lg">
          <UserPlus className="h-4 w-4" /> Registrar Nuevo Partner
        </Button>
      </div>

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
                  <TableCell className="text-sm font-medium">{partner.pais || 'Sin asignar'}</TableCell>
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
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="font-black uppercase text-[10px] tracking-widest opacity-50">Auditoría</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 cursor-pointer font-bold" onSelect={() => setSelectedPartner(partner)}>
                            <Info className="h-4 w-4 text-primary" /> Ver Ficha Técnica
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer font-bold" onSelect={() => window.open(`/partners/${partner.id}/public`, '_blank')}>
                            <ExternalLink className="h-4 w-4 text-accent" /> Perfil Público
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive font-black uppercase text-[10px]" onSelect={() => handleSuspend(partner.id)}>
                            <ShieldAlert className="h-4 w-4" /> Suspender
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

      <PartnerDetailsModal partner={selectedPartner} open={!!selectedPartner} onClose={closeDetails} />
      <CreatePartnerModal open={isCreateOpen} onClose={closeDetails} firestore={firestore} />
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
