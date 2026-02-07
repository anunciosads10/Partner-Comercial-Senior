'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, CreditCard, QrCode, Eye, Copy, Loader2, Search, Edit, Trash2, Shield, Calendar, Globe, Award, Link as LinkIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { seedAllData } from "@/lib/seed-data";

const generateAffiliateLink = (platformUrl, partner) => {
  if (!platformUrl) return "Configura la URL en la Plataforma";
  if (!partner) return "";
  const identifier = partner.referralCode || partner.id;
  const cleanBase = platformUrl.endsWith('/') ? platformUrl.slice(0, -1) : platformUrl;
  return `${cleanBase}?ref=${identifier}`;
};

function getTierBadgeVariant(tier) {
  switch (tier) {
    case 'Platinum': return 'default';
    case 'Gold': return 'secondary';
    case 'Silver': return 'outline';
    default: return 'destructive';
  }
}

function getStatusBadgeVariant(status) {
  switch (status) {
    case 'Active': return 'default';
    case 'Suspended': return 'destructive';
    default: return 'secondary';
  }
}

const SuperAdminPartnersView = ({ partners, isLoading, firestore, searchTerm, setSearchTerm, allPlatforms }) => {
  const { toast } = useToast();
  const [partnerToDelete, setPartnerToDelete] = React.useState(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState(false);
  const [partnerToEdit, setPartnerToEdit] = React.useState(null);
  const [openMenuId, setOpenMenuId] = React.useState(null);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [newPartner, setNewPartner] = React.useState({ name: '', email: '', tier: 'Silver', pais: '' });

  const handleSeedData = async () => {
    if (!firestore) return;
    await seedAllData(firestore);
    toast({ title: "Datos de Prueba Cargados" });
  }

  const handleToggleSuspend = async (partner) => {
    if (!firestore || !partner) return;
    const partnerRef = doc(firestore, "partners", partner.id);
    const newStatus = partner.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await updateDoc(partnerRef, { status: newStatus });
      toast({ title: "Estado Actualizado", description: `Partner ${partner.name} ahora está ${newStatus}` });
    } catch (error) {
      console.error(error);
    }
  };
  
  const openEditDialog = (partner) => { 
    setPartnerToEdit({ ...partner }); 
    setEditDialogOpen(true); 
    setOpenMenuId(null); 
  };
  
  const openDeleteAlert = (partner) => { 
    setPartnerToDelete(partner); 
    setAlertOpen(true); 
    setOpenMenuId(null); 
  };

  const confirmDeletePartner = async () => {
    if (!firestore || !partnerToDelete) return;
    try {
      await deleteDoc(doc(firestore, "partners", partnerToDelete.id));
      toast({ title: "Partner Eliminado" });
    } catch (error) {
      console.error(error);
    } finally { setAlertOpen(false); }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    if (!firestore) return;
    try {
        await addDoc(collection(firestore, 'partners'), { 
          ...newPartner, 
          status: 'Active', 
          joinDate: new Date().toISOString(), 
          totalSales: 0, 
          revenue: 0, 
          avatarUrl: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/200` 
        });
        toast({ title: "Partner Creado" });
        setCreateDialogOpen(false);
        setNewPartner({ name: '', email: '', tier: 'Silver', pais: '' });
    } catch (error) { console.error(error); }
  };

  const handleUpdatePartner = async (e) => {
    e.preventDefault();
    if (!firestore || !partnerToEdit) return;
    try {
        const partnerRef = doc(firestore, "partners", partnerToEdit.id);
        await updateDoc(partnerRef, {
            name: partnerToEdit.name,
            email: partnerToEdit.email,
            tier: partnerToEdit.tier,
            pais: partnerToEdit.pais
        });
        toast({ title: "Partner Actualizado" });
        setEditDialogOpen(false);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Gestión de Partners</CardTitle>
              <CardDescription>Crea, edita y administra el ecosistema de socios comerciales.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSeedData} variant="outline">Cargar Demo</Button>
              <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Crear Partner</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar socios..." 
              className="pl-8 bg-secondary/50" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Nivel / Tier</TableHead>
                <TableHead>Link de Afiliado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
              ) : partners?.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar><AvatarImage src={partner.avatarUrl}/><AvatarFallback>{partner.name?.slice(0,2)}</AvatarFallback></Avatar>
                      <div><div className="font-medium">{partner.name}</div><div className="text-xs text-muted-foreground">{partner.email}</div></div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getTierBadgeVariant(partner.tier)}>{partner.tier}</Badge></TableCell>
                  <TableCell>
                    <code className="text-[10px] bg-muted p-1 rounded max-w-[150px] truncate block">
                      {generateAffiliateLink(allPlatforms?.[0]?.websiteUrl, partner)}
                    </code>
                  </TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(partner.status)}>{partner.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu open={openMenuId === partner.id} onOpenChange={(o) => setOpenMenuId(o ? partner.id : null)}>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => openEditDialog(partner)}><Edit className="mr-2 h-4 w-4"/>Editar Perfil</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleToggleSuspend(partner)}>
                          {partner.status === 'Active' ? <><Shield className="mr-2 h-4 w-4 text-destructive"/> Suspender</> : <><Shield className="mr-2 h-4 w-4 text-primary"/> Activar</>}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => openDeleteAlert(partner)}><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreatePartner}>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Socio</DialogTitle>
              <DialogDescription>Completa los datos para registrar un nuevo socio en PartnerVerse.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Comercial / Persona</Label>
                <Input id="name" value={newPartner.name} onChange={(e) => setNewPartner({...newPartner, name: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Corporativo</Label>
                <Input id="email" type="email" value={newPartner.email} onChange={(e) => setNewPartner({...newPartner, email: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pais">País de Operación</Label>
                <Input id="pais" value={newPartner.pais} onChange={(e) => setNewPartner({...newPartner, pais: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tier">Nivel Asignado</Label>
                <Select value={newPartner.tier} onValueChange={(v) => setNewPartner({...newPartner, tier: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Crear Partner</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdatePartner}>
            <DialogHeader>
              <DialogTitle>Editar Perfil de Socio</DialogTitle>
              <DialogDescription>Modifica la información básica del partner seleccionado.</DialogDescription>
            </DialogHeader>
            {partnerToEdit && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input id="edit-name" value={partnerToEdit.name} onChange={(e) => setPartnerToEdit({...partnerToEdit, name: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={partnerToEdit.email} onChange={(e) => setPartnerToEdit({...partnerToEdit, email: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-pais">País</Label>
                  <Input id="edit-pais" value={partnerToEdit.pais} onChange={(e) => setPartnerToEdit({...partnerToEdit, pais: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-tier">Nivel</Label>
                  <Select value={partnerToEdit.tier} onValueChange={(v) => setPartnerToEdit({...partnerToEdit, tier: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al socio <span className="font-bold">{partnerToDelete?.name}</span> y todo su historial de comisiones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePartner} className="bg-destructive hover:bg-destructive/90 text-white">Eliminar Definitivamente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const AdminPartnersView = ({ partner, allPlatforms }) => {
  const { toast } = useToast();

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Enlace Copiado", description: "El link de afiliado está en tu portapapeles." });
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                  <AvatarImage src={partner?.avatarUrl}/>
                  <AvatarFallback className="text-xl">{partner?.name?.slice(0,2)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{partner?.name}</CardTitle>
                  <CardDescription>{partner?.email}</CardDescription>
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Badge variant={getTierBadgeVariant(partner?.tier)} className="text-lg px-6 py-1.5 uppercase tracking-wider">
                  Nivel {partner?.tier}
                </Badge>
                <Badge variant={getStatusBadgeVariant(partner?.status)} className="px-3">Cuenta {partner?.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3 pt-6">
            <div className="space-y-1 p-4 rounded-lg bg-secondary/30">
                <Label className="text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3"/> País / Territorio</Label>
                <p className="font-semibold text-lg">{partner?.pais || 'Sin asignar'}</p>
            </div>
            <div className="space-y-1 p-4 rounded-lg bg-secondary/30">
                <Label className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3"/> Miembro desde</Label>
                <p className="font-semibold text-lg">{partner?.joinDate ? new Date(partner.joinDate).toLocaleDateString() : 'N/A'}</p>
            </div>
             <div className="space-y-1 p-4 rounded-lg bg-secondary/30">
                <Label className="text-muted-foreground flex items-center gap-1"><Award className="h-3 w-3"/> ID de Socio</Label>
                <p className="font-mono text-sm">{partner?.id}</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-full"><LinkIcon className="h-6 w-6 text-primary" /></div>
             <div>
                <CardTitle>Generador de Enlaces de Afiliado</CardTitle>
                <CardDescription>Usa estos enlaces personalizados para referir clientes y ganar comisiones recurrentes.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allPlatforms?.map((platform) => {
              const link = generateAffiliateLink(platform.websiteUrl, partner);
              return (
                <Card key={platform.id} className="border-accent/20 hover:border-accent/40 transition-all bg-accent/5 group">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-bold text-primary">{platform.name}</CardTitle>
                    <CardDescription className="text-xs uppercase tracking-tight">{platform.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-col gap-3">
                      <div className="text-[10px] text-muted-foreground break-all bg-background p-2 rounded border border-dashed group-hover:bg-secondary/20 transition-colors">
                        {link}
                      </div>
                      <Button size="sm" variant="outline" className="w-full text-xs font-semibold" onClick={() => copyToClipboard(link)}>
                        <Copy className="mr-2 h-3 w-3" />
                        Copiar Link Personalizado
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center text-[10px] border-t border-accent/10 mt-2">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground">Inscripción: <b className="text-foreground">{platform.firstSubscriptionCommission}%</b></span>
                        <span className="text-muted-foreground">Recurrente: <b className="text-foreground">{platform.recurringCommission}%</b></span>
                    </div>
                    <Badge variant="outline" className="text-[8px] h-4 bg-green-50 text-green-700 border-green-200">Activo</Badge>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          {(!allPlatforms || allPlatforms?.length === 0) && (
             <div className="text-center py-12 border-2 border-dashed rounded-lg bg-secondary/10">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No hay plataformas de afiliación activas en este momento.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function PartnersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = React.useState('');

  const userRoleDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userData, isLoading: isRoleLoading } = useDoc(userRoleDocRef);
  const { role } = userData || {};

  const partnersCollection = useMemoFirebase(() => (firestore && role === 'superadmin') ? collection(firestore, 'partners') : null, [firestore, role]);
  const { data: partners, isLoading: arePartnersLoading } = useCollection(partnersCollection);
  
  const platformsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'saasPlatforms') : null, [firestore]);
  const { data: allPlatforms } = useCollection(platformsCollection);
  
  const partnerDocRef = useMemoFirebase(() => {
    if (!firestore || role !== 'admin' || !user) return null;
    return doc(firestore, 'partners', user.uid);
  }, [firestore, role, user]);
  const { data: partnerData, isLoading: isLoadingPartnerData } = useDoc(partnerDocRef);

  const filteredPartners = React.useMemo(() => partners?.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.pais || '').toLowerCase().includes(searchTerm.toLowerCase())
  ), [partners, searchTerm]);

  if (isRoleLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (role === 'superadmin') {
    return (
      <SuperAdminPartnersView 
        partners={filteredPartners} 
        isLoading={arePartnersLoading} 
        firestore={firestore} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        allPlatforms={allPlatforms} 
      />
    );
  }

  if (role === 'admin') {
    if (isLoadingPartnerData) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    return <AdminPartnersView partner={partnerData} allPlatforms={allPlatforms} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acceso Restringido</CardTitle>
        <CardDescription>No tienes permisos suficientes para ver esta sección.</CardDescription>
      </CardHeader>
    </Card>
  );
}
