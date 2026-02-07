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
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser, useStorage } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, addDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { seedAllData } from "@/lib/seed-data";
import { slugify } from "@/lib/utils";
import Image from 'next/image';

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
      toast({ title: "Estado Actualizado" });
    } catch (error) {
      console.error(error);
    }
  };
  
  const openEditDialog = (partner) => { setPartnerToEdit(partner); setEditDialogOpen(true); setOpenMenuId(null); };
  const openDeleteAlert = (partner) => { setPartnerToDelete(partner); setAlertOpen(true); setOpenMenuId(null); };

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
        await addDoc(collection(firestore, 'partners'), { ...newPartner, status: 'Active', joinDate: new Date().toISOString(), totalSales: 0, revenue: 0, avatarUrl: `https://picsum.photos/seed/${Math.random()}/200` });
        toast({ title: "Partner Creado" });
        setCreateDialogOpen(false);
        setNewPartner({ name: '', email: '', tier: 'Silver', pais: '' });
    } catch (error) { console.error(error); }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Partners</CardTitle>
              <CardDescription>Crea, edita, activa y suspende partners.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSeedData} variant="outline">Cargar Datos de Prueba</Button>
              <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Crear Partner</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, email o país..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Link de Afiliado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners?.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar><AvatarImage src={partner.avatarUrl}/><AvatarFallback>{partner.name?.slice(0,2)}</AvatarFallback></Avatar>
                      <div><div className="font-medium">{partner.name}</div><div className="text-xs text-muted-foreground">{partner.email}</div></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted p-1 rounded max-w-[150px] truncate block">
                      {generateAffiliateLink(allPlatforms?.[0]?.websiteUrl, partner)}
                    </code>
                  </TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(partner.status)}>{partner.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu open={openMenuId === partner.id} onOpenChange={(o) => setOpenMenuId(o ? partner.id : null)}>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEditDialog(partner)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleToggleSuspend(partner)}>{partner.status === 'Active' ? 'Suspender' : 'Activar'}</DropdownMenuItem>
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
      {/* Alert Dialogs handled locally in production */}
    </>
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
  
  const filteredPartners = React.useMemo(() => partners?.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())), [partners, searchTerm]);

  if (isRoleLoading) return <p>Cargando...</p>;
  if (role === 'superadmin') return <SuperAdminPartnersView partners={filteredPartners} isLoading={arePartnersLoading} firestore={firestore} searchTerm={searchTerm} setSearchTerm={setSearchTerm} allPlatforms={allPlatforms} />;
  return <p>Vista de partner cargando...</p>;
}
