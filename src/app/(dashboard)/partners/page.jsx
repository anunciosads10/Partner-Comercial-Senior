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
  CardFooter
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
import { MoreHorizontal, PlusCircle, User, FileText, Calendar, Globe, Award, Shield, Trash2, Search, Edit, CreditCard, Banknote, QrCode, Puzzle } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [openMenuId, setOpenMenuId] = React.useState(null);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
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
    setOpenMenuId(null);
  };
  
  const openDeleteAlert = (partner) => {
    setPartnerToDelete(partner);
    setAlertOpen(true);
    setOpenMenuId(null);
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
      setAlertOpen(false);
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
                        <DropdownMenu open={openMenuId === partner.id} onOpenChange={(isOpen) => setOpenMenuId(isOpen ? partner.id : null)}>
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
                             <DropdownMenuItem className="text-destructive" onSelect={() => openDeleteAlert(partner)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
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
      
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
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

const PaymentInfoForm = ({ paymentInfo, partnerId, firestore, onFinished }) => {
    const { toast } = useToast();
    const [method, setMethod] = React.useState(paymentInfo?.method || 'nequi');
    const [formData, setFormData] = React.useState({
        holderName: paymentInfo?.holderName || '',
        phone: paymentInfo?.phone || '',
        bank: paymentInfo?.bank || '',
        accountNumber: paymentInfo?.accountNumber || '',
        accountType: paymentInfo?.accountType || 'Ahorros',
    });
    const fileInputRef = React.useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
      if (e.target.files[0]) {
        toast({ title: `Archivo QR seleccionado: ${e.target.files[0].name}` });
        // Aquí iría la lógica para subir el archivo
      }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!firestore || !partnerId) return;

        const partnerRef = doc(firestore, 'partners', partnerId);
        const dataToSave = {
            method,
            status: 'pending', // Siempre se guarda como pendiente para verificación
            updatedAt: new Date().toISOString(),
            ...formData,
        };

        try {
            await updateDoc(partnerRef, { paymentInfo: dataToSave });
            toast({
                title: "Datos de Pago Guardados",
                description: "Tu información de pago ha sido guardada y está pendiente de verificación.",
            });
            onFinished();
        } catch (error) {
            console.error("Error al guardar datos de pago:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron guardar tus datos de pago.",
            });
        }
    };


    return (
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Configurar Datos de Pago</DialogTitle>
          <DialogDescription>
            Esta información se usará para enviarte tus comisiones. Asegúrate de que sea correcta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="method">Método de Pago</Label>
             <Select id="method" value={method} onValueChange={setMethod}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecciona un método" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="nequi">Nequi</SelectItem>
                    <SelectItem value="daviplata">Daviplata</SelectItem>
                    <SelectItem value="bre-b">Bre-B</SelectItem>
                    <SelectItem value="bancolombia">Cuenta Bancaria</SelectItem>
                </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
             <Label htmlFor="holderName">Nombre del Titular</Label>
             <Input id="holderName" name="holderName" value={formData.holderName} onChange={handleChange} required />
          </div>

          {(method === 'nequi' || method === 'daviplata' || method === 'bre-b') && (
            <div className="grid gap-2">
                <Label htmlFor="phone">Número de Celular</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
          )}

          {method === 'bancolombia' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="bank">Banco</Label>
                <Input id="bank" name="bank" value={formData.bank} onChange={handleChange} required />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="accountType">Tipo de Cuenta</Label>
                <Select id="accountType" name="accountType" value={formData.accountType} onValueChange={(v) => setFormData(p => ({...p, accountType: v}))}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Ahorros">Ahorros</SelectItem>
                        <SelectItem value="Corriente">Corriente</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountNumber">Número de Cuenta</Label>
                <Input id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />
              </div>
            </>
          )}

          {(method === 'nequi' || method === 'bancolombia' || method === 'daviplata' || method === 'bre-b') && (
             <div className="space-y-2">
                <Label>Código QR (Opcional)</Label>
                <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg h-40 bg-muted">
                    <div className="text-center text-muted-foreground">
                    <QrCode className="mx-auto h-12 w-12"/>
                    <Button size="sm" type="button" variant="ghost" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                        Subir Imagen del QR
                    </Button>
                    <Input 
                        id="qr-upload" 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                    />
                    </div>
                </div>
            </div>
          )}


        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onFinished}>Cancelar</Button>
          <Button type="submit">Guardar Datos</Button>
        </DialogFooter>
      </form>
    )
};

const RequestAffiliationForm = ({ onFinished, toast }) => {
  const [selectedPlatform, setSelectedPlatform] = React.useState(null);

  // Datos de ejemplo
  const availablePlatforms = [
    { id: 'saas-ecom', name: 'SaaS E-commerce Pro', description: 'Solución completa para tiendas online.' },
    { id: 'saas-booking', name: 'SaaS Booking System', description: 'Gestión de reservas para hoteles y servicios.' },
    { id: 'saas-learning', name: 'SaaS Learning Platform', description: 'Plataforma para cursos y formación online.' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlatform) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar una plataforma para solicitar la afiliación.",
      });
      return;
    }
    
    // Aquí iría la lógica para enviar la solicitud a Firestore
    console.log("Solicitando afiliación para:", selectedPlatform);
    
    toast({
      title: "Solicitud Enviada",
      description: `Tu solicitud para afiliarte a ${selectedPlatform.name} ha sido enviada para revisión.`,
    });
    
    onFinished();
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Solicitar Nueva Afiliación</DialogTitle>
        <DialogDescription>
          Elige una de las plataformas SaaS disponibles para enviar tu solicitud de afiliación.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <RadioGroup onValueChange={(value) => setSelectedPlatform(availablePlatforms.find(p => p.id === value))}>
          <div className="space-y-3">
            {availablePlatforms.map((platform) => (
              <Label
                key={platform.id}
                htmlFor={platform.id}
                className="flex items-start gap-4 rounded-md border p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground has-[:checked]:bg-primary/10 has-[:checked]:border-primary"
              >
                <RadioGroupItem value={platform.id} id={platform.id} className="mt-1" />
                <div className="grid gap-1.5">
                    <span className="font-bold">{platform.name}</span>
                    <span className="text-sm text-muted-foreground">{platform.description}</span>
                </div>
              </Label>
            ))}
          </div>
        </RadioGroup>
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onFinished}>Cancelar</Button>
        <Button type="submit" disabled={!selectedPlatform}>Enviar Solicitud</Button>
      </DialogFooter>
    </form>
  );
};


const AdminPartnerView = ({ partnerData, isLoading }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPaymentInfoOpen, setPaymentInfoOpen] = React.useState(false);
  const [isAffiliationOpen, setAffiliationOpen] = React.useState(false);


  // Datos de ejemplo para las afiliaciones
  const affiliations = [
    {
      platform: 'Restaurante POS',
      type: 'Comercial',
      commission: '20%',
      status: 'Active',
    },
    {
      platform: 'Autoservicios SaaS',
      type: 'Referido',
      commission: '15%',
      status: 'Inactive',
    },
  ];

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

  const { paymentInfo } = partnerData;

  const getPaymentStatusVariant = (status) => {
    switch (status) {
        case 'verified': return 'default';
        case 'pending': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <div className="space-y-6">
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

    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Datos de Pago</CardTitle>
              <CardDescription>La información a donde se enviarán tus comisiones.</CardDescription>
            </div>
            <Dialog open={isPaymentInfoOpen} onOpenChange={setPaymentInfoOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Edit className="mr-2 h-4 w-4" />{paymentInfo ? 'Editar' : 'Añadir'} Datos</Button>
                </DialogTrigger>
                <DialogContent>
                    <PaymentInfoForm 
                        paymentInfo={paymentInfo} 
                        partnerId={partnerData.id} 
                        firestore={firestore} 
                        onFinished={() => setPaymentInfoOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            {paymentInfo ? (
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Estado de Verificación</span>
                        <Badge variant={getPaymentStatusVariant(paymentInfo.status)}>{paymentInfo.status || 'Pendiente'}</Badge>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Método de Pago</span>
                        <span className="font-medium capitalize">{paymentInfo.method}</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Titular</span>
                        <span className="font-medium">{paymentInfo.holderName}</span>
                    </div>
                    {paymentInfo.method === 'nequi' && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Teléfono</span>
                            <span className="font-medium">{paymentInfo.phone}</span>
                        </div>
                    )}
                    {paymentInfo.method === 'bancolombia' && (
                         <>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Banco</span>
                                <span className="font-medium">{paymentInfo.bank}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Número de Cuenta</span>
                                <span className="font-medium">{paymentInfo.accountNumber}</span>
                            </div>
                         </>
                    )}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CreditCard className="mx-auto h-12 w-12 mb-4" />
                  <p>Aún no has configurado tus datos de pago.</p>
                  <p className="text-sm">Añade tu información para poder recibir comisiones.</p>
                </div>
            )}
        </CardContent>
    </Card>

    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Afiliaciones SaaS</CardTitle>
            <CardDescription>Plataformas a las que estás afiliado y tus comisiones.</CardDescription>
          </div>
           <Dialog open={isAffiliationOpen} onOpenChange={setAffiliationOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Añadir Afiliación</Button>
                </DialogTrigger>
                <DialogContent>
                    <RequestAffiliationForm 
                        onFinished={() => setAffiliationOpen(false)}
                        toast={toast}
                    />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              {affiliations.map((aff, index) => (
                <div key={index} className="p-4 rounded-lg border bg-secondary/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                      <Puzzle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold">{aff.platform}</p>
                      <p className="text-sm text-muted-foreground">{aff.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 text-sm">
                      <div className="text-center">
                          <p className="font-semibold text-lg">{aff.commission}</p>
                          <p className="text-muted-foreground text-xs">Comisión</p>
                      </div>
                       <div className="text-center">
                          <Badge variant={getStatusBadgeVariant(aff.status)}>{aff.status}</Badge>
                          <p className="text-muted-foreground text-xs mt-1">Estado</p>
                      </div>
                  </div>
                </div>
              ))}
            </div>
             {affiliations.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Puzzle className="mx-auto h-12 w-12 mb-4" />
                  <p>Aún no estás afiliado a ninguna plataforma.</p>
                  <p className="text-sm">Solicita una afiliación para empezar a ganar comisiones.</p>
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
