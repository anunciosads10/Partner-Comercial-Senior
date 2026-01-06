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
  AlertDialogTrigger,
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
import { MoreHorizontal, PlusCircle, User, FileText, Calendar, Globe, Award, Shield, Trash2, Search, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, writeBatch, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { partners as mockPartners } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import React from "react";

function getTierBadgeVariant(tier) {
  switch (tier) {
    case 'Platinum':
      return 'default';
    case 'Gold':
      return 'secondary';
    case 'Silver':
      return 'outline';
    case 'Bronze':
    default:
      return 'destructive';
  }
}

function getStatusBadgeVariant(status) {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Suspended':
      return 'destructive';
    case 'Inactive':
    default:
      return 'secondary';
  }
}

const SuperAdminPartnersView = ({ partners, isLoading, onSeedData, firestore, searchTerm, setSearchTerm }) => {
  const { toast } = useToast();
  const [partnerToDelete, setPartnerToDelete] = React.useState(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState(false);
  const [partnerToEdit, setPartnerToEdit] = React.useState(null);
  const [newPartner, setNewPartner] = React.useState({
    name: '',
    email: '',
    tier: 'Silver',
    pais: ''
  });

  const handleToggleSuspend = async (partner) => {
    if (!firestore || !partner) return;
    const partnerRef = doc(firestore, "partners", partner.id);
    const newStatus = partner.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await updateDoc(partnerRef, { status: newStatus });
      toast({
        title: "Estado Actualizado",
        description: `El partner ${partner.name} ha sido ${newStatus === 'Active' ? 'reactivado' : 'suspendido'}.`,
      });
    } catch (error) {
      console.error("Error al actualizar el estado del partner:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "No se pudo cambiar el estado del partner.",
      });
    }
  };
  
  const openEditDialog = (partner) => {
    setPartnerToEdit(partner);
    setEditDialogOpen(true);
  };
  
  const confirmDeletePartner = async () => {
    if (!firestore || !partnerToDelete) return;
    const partnerRef = doc(firestore, "partners", partnerToDelete.id);
    try {
      await deleteDoc(partnerRef);
      toast({
        title: "Partner Eliminado",
        description: `El partner ${partnerToDelete.name} ha sido eliminado permanentemente.`,
      });
    } catch (error) {
      console.error("Error al eliminar el partner:", error);
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "No se pudo eliminar el partner.",
      });
    } finally {
      setPartnerToDelete(null);
    }
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
            avatarUrl: `https://picsum.photos/seed/${Math.random()}/200`,
        });
        toast({
            title: "Partner Creado",
            description: `El partner ${newPartner.name} ha sido añadido exitosamente.`,
        });
        setCreateDialogOpen(false); // Cierra el diálogo
        setNewPartner({ name: '', email: '', tier: 'Silver', pais: '' }); // Resetea el formulario
    } catch (error) {
        console.error("Error al crear el partner:", error);
        toast({
            variant: "destructive",
            title: "Error al crear",
            description: "No se pudo crear el nuevo partner.",
        });
    }
  };

  const handleUpdatePartner = async (e) => {
    e.preventDefault();
    if (!firestore || !partnerToEdit) return;
    
    const partnerRef = doc(firestore, "partners", partnerToEdit.id);
    try {
      await updateDoc(partnerRef, partnerToEdit);
      toast({
        title: "Partner Actualizado",
        description: `Los datos de ${partnerToEdit.name} han sido actualizados.`,
      });
      setEditDialogOpen(false);
      setPartnerToEdit(null);
    } catch (error) {
      console.error("Error al actualizar el partner:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "No se pudo guardar los cambios del partner.",
      });
    }
  };


  return (
    <>
      <AlertDialog>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestión de Partners</CardTitle>
                <CardDescription>Crea, edita, activa y suspende partners.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={onSeedData} variant="outline" disabled={!firestore}>Cargar Datos de Prueba</Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Crear Partner
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleCreatePartner}>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Partner</DialogTitle>
                        <DialogDescription>
                          Completa los detalles para añadir un nuevo partner al programa.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Nombre
                          </Label>
                          <Input
                            id="name"
                            value={newPartner.name}
                            onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="email" className="text-right">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={newPartner.email}
                            onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                            className="col-span-3"
                            required
                          />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="pais" className="text-right">
                            País
                          </Label>
                          <Input
                            id="pais"
                            value={newPartner.pais}
                            onChange={(e) => setNewPartner({ ...newPartner, pais: e.target.value })}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tier" className="text-right">
                                Nivel
                            </Label>
                             <Select
                                value={newPartner.tier}
                                onValueChange={(value) => setNewPartner({ ...newPartner, tier: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona un nivel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Silver">Silver</SelectItem>
                                    <SelectItem value="Gold">Gold</SelectItem>
                                    <SelectItem value="Platinum">Platinum</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">
                            Cancelar
                          </Button>
                        </DialogClose>
                        <Button type="submit">Guardar Partner</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, email o país..."
                className="w-full rounded-lg bg-secondary pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isLoading ? <p>Cargando partners...</p> : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners?.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={partner.avatarUrl} alt={partner.name} />
                              <AvatarFallback>{partner.name?.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{partner.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {partner.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTierBadgeVariant(partner.tier)}>
                            {partner.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>{partner.pais}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(partner.status)}>
                            {partner.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => openEditDialog(partner)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleToggleSuspend(partner)}>
                                {partner.status === 'Active' ? 'Suspender' : 'Reactivar'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                               <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive" onSelect={() => setPartnerToDelete(partner)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {partners?.length === 0 && (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg bg-secondary mt-4">
                    <p className="text-muted-foreground">{searchTerm ? 'No se encontraron partners.' : 'No hay partners en la base de datos.'}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutely seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al partner
              <span className="font-bold"> {partnerToDelete?.name}</span> y borrará sus datos de nuestros servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPartnerToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePartner}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGO PARA EDITAR */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdatePartner}>
            {partnerToEdit && (
              <>
                <DialogHeader>
                  <DialogTitle>Editar Partner</DialogTitle>
                  <DialogDescription>
                    Actualiza los datos del partner. Haz clic en guardar cuando termines.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-name" className="text-right">
                      Nombre
                    </Label>
                    <Input
                      id="edit-name"
                      value={partnerToEdit.name || ''}
                      onChange={(e) => setPartnerToEdit({ ...partnerToEdit, name: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={partnerToEdit.email || ''}
                      onChange={(e) => setPartnerToEdit({ ...partnerToEdit, email: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-pais" className="text-right">
                      País
                    </Label>
                    <Input
                      id="edit-pais"
                      value={partnerToEdit.pais || ''}
                      onChange={(e) => setPartnerToEdit({ ...partnerToEdit, pais: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-tier" className="text-right">
                          Nivel
                      </Label>
                        <Select
                          value={partnerToEdit.tier || 'Silver'}
                          onValueChange={(value) => setPartnerToEdit({ ...partnerToEdit, tier: value })}
                      >
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Selecciona un nivel" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Silver">Silver</SelectItem>
                              <SelectItem value="Gold">Gold</SelectItem>
                              <SelectItem value="Platinum">Platinum</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

const AdminPartnerView = ({ partnerData, isLoading }) => {
  if (isLoading) {
    return <p>Cargando tu perfil...</p>;
  }

  if (!partnerData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perfil de Partner no Encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hemos podido encontrar tus datos de partner. Por favor, contacta con un administrador.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu Perfil de Partner</CardTitle>
        <CardDescription>Aquí puedes ver los detalles de tu cuenta de partner.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={partnerData.avatarUrl} alt={partnerData.name} />
            <AvatarFallback>{partnerData.name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{partnerData.name}</h2>
            <p className="text-muted-foreground">{partnerData.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Award className="text-muted-foreground" />
            <span>Nivel: <Badge variant={getTierBadgeVariant(partnerData.tier)}>{partnerData.tier}</Badge></span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="text-muted-foreground" />
            <span>Estado: <Badge variant={getStatusBadgeVariant(partnerData.status)}>{partnerData.status}</Badge></span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="text-muted-foreground" />
            <span>País: {partnerData.pais}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground" />
            <span>Miembro desde: {new Date(partnerData.joinDate).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default function PartnersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = React.useState('');

  // 1. Obtener el rol del usuario
  const userRoleDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: isRoleLoading } = useDoc(userRoleDocRef);
  const { role } = userData || {};

  // 2. Obtener datos según el rol
  // Para SuperAdmin: obtener todos los partners
  const partnersCollection = useMemoFirebase(() => {
    if (!firestore || role !== 'superadmin') return null;
    return collection(firestore, 'partners');
  }, [firestore, role]);
  const { data: partners, isLoading: arePartnersLoading } = useCollection(partnersCollection);
  
  const filteredPartners = React.useMemo(() => {
    if (!partners) return [];
    return partners.filter(partner =>
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (partner.pais && partner.pais.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [partners, searchTerm]);


  // Para Admin: obtener solo sus propios datos de partner
  const partnerDocRef = useMemoFirebase(() => {
    if (!firestore || role !== 'admin' || !user) return null;
    return doc(firestore, 'partners', user.uid);
  }, [firestore, role, user]);
  const { data: partnerData, isLoading: isPartnerDataLoading } = useDoc(partnerDocRef);


  const seedData = async () => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    mockPartners.forEach((partner) => {
      const docRef = doc(firestore, "partners", partner.id);
      batch.set(docRef, partner);
    });
    await batch.commit();
    console.log("Datos de prueba sembrados exitosamente!");
  };

  const isLoading = isRoleLoading || (role === 'superadmin' && arePartnersLoading) || (role === 'admin' && isPartnerDataLoading);

  if (isRoleLoading) {
    return <p>Cargando...</p>;
  }

  if (role === 'superadmin') {
    return <SuperAdminPartnersView partners={filteredPartners} isLoading={isLoading} onSeedData={seedData} firestore={firestore} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>;
  }
  
  if (role === 'admin') {
    return <AdminPartnerView partnerData={partnerData} isLoading={isLoading} />;
  }

  return null; // O un mensaje de 'Acceso no autorizado'
}
