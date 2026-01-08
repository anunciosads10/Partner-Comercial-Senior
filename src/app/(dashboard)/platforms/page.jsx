'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Puzzle, Loader2, Eye } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const PlatformStatusBadge = ({ status }) => {
  const variant = status === 'Active' ? 'default' : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
};

const PlatformDetailsDialog = ({ platform, isOpen, onOpenChange }) => {
    if (!platform) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Detalles de la Plataforma</DialogTitle>
                    <DialogDescription>
                        Información completa de la plataforma SaaS.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-muted-foreground">Nombre</Label>
                        <span className="col-span-2 font-medium">{platform.name}</span>
                    </div>
                    <div className="grid grid-cols-3 items-start gap-4">
                        <Label className="text-muted-foreground pt-1">Descripción</Label>
                        <span className="col-span-2">{platform.description}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-muted-foreground">Categoría</Label>
                        <span className="col-span-2">{platform.category}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-muted-foreground">Estado</Label>
                        <div className="col-span-2">
                           <PlatformStatusBadge status={platform.status} />
                        </div>
                    </div>
                    <div className="border-t pt-4 mt-2 grid gap-4">
                         <h4 className="font-semibold text-foreground col-span-3">Comisiones</h4>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label className="text-muted-foreground">Comisión Inicial</Label>
                            <span className="col-span-2 font-bold text-primary">{(platform.firstSubscriptionCommission || 0)}%</span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label className="text-muted-foreground">Comisión Recurrente</Label>
                            <span className="col-span-2 font-bold text-primary">{(platform.recurringCommission || 0)}%</span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const PlatformsPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const platformsCollection = useMemoFirebase(() => 
    firestore ? collection(firestore, 'saasPlatforms') : null, 
    [firestore]
  );
  const { data: platforms, isLoading } = useCollection(platformsCollection);

  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [currentPlatform, setCurrentPlatform] = React.useState(null);
  const [platformToDelete, setPlatformToDelete] = React.useState(null);
  const [openMenuId, setOpenMenuId] = React.useState(null);

  // Estados para el diálogo de detalles
  const [isDetailOpen, setDetailOpen] = React.useState(false);
  const [platformToView, setPlatformToView] = React.useState(null);


  const openNewDialog = () => {
    setCurrentPlatform(null);
    setDialogOpen(true);
  };

  const openEditDialog = (platform) => {
    setCurrentPlatform(platform);
    setDialogOpen(true);
    setOpenMenuId(null);
  };

  const openDeleteAlert = (platform) => {
    setPlatformToDelete(platform);
    setAlertOpen(true);
    setOpenMenuId(null);
  };

  const openDetailDialog = (platform) => {
    setPlatformToView(platform);
    setDetailOpen(true);
    setOpenMenuId(null);
  };

  const handleSavePlatform = async (e) => {
    e.preventDefault();
    if (!firestore) return;

    const formData = new FormData(e.target);
    const platformData = {
      name: formData.get('name'),
      category: formData.get('category'),
      description: formData.get('description'),
      status: formData.get('status'),
      firstSubscriptionCommission: Number(formData.get('firstSubscriptionCommission')) || 0,
      recurringCommission: Number(formData.get('recurringCommission')) || 0,
    };

    try {
      if (currentPlatform?.id) {
        // Update existing platform
        const platformRef = doc(firestore, 'saasPlatforms', currentPlatform.id);
        await updateDoc(platformRef, platformData);
        toast({ title: "Plataforma Actualizada", description: "La plataforma ha sido modificada." });
      } else {
        // Create new platform
        await addDoc(collection(firestore, 'saasPlatforms'), platformData);
        toast({ title: "Plataforma Creada", description: "La nueva plataforma SaaS ha sido añadida." });
      }
      setDialogOpen(false);
      setCurrentPlatform(null);
    } catch (error) {
      console.error("Error al guardar la plataforma:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la plataforma." });
    }
  };
  
  const handleDeletePlatform = async () => {
    if (!firestore || !platformToDelete) return;
    try {
      await deleteDoc(doc(firestore, 'saasPlatforms', platformToDelete.id));
      toast({ title: "Plataforma Eliminada", description: "La plataforma ha sido eliminada.", variant: "destructive" });
    } catch (error) {
      console.error("Error al eliminar la plataforma:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la plataforma." });
    } finally {
      setAlertOpen(false);
      setPlatformToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Puzzle /> Gestión de Plataformas SaaS
              </CardTitle>
              <CardDescription>
                Crea, edita y administra los productos SaaS a los que los partners pueden afiliarse.
              </CardDescription>
            </div>
            <Button onClick={openNewDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Plataforma
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms?.map((platform) => (
                  <TableRow key={platform.id}>
                    <TableCell>
                      <div className="font-medium">{platform.name}</div>
                      <div className="text-sm text-muted-foreground">{platform.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{platform.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <PlatformStatusBadge status={platform.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu open={openMenuId === platform.id} onOpenChange={(isOpen) => setOpenMenuId(isOpen ? platform.id : null)}>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                           <DropdownMenuItem onSelect={() => openDetailDialog(platform)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEditDialog(platform)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                           <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={() => openDeleteAlert(platform)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && platforms?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <Puzzle className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No hay plataformas SaaS configuradas.</p>
                <p className="text-sm text-muted-foreground">¡Crea la primera para empezar!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px] flex flex-col max-h-[90vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{currentPlatform ? 'Editar Plataforma SaaS' : 'Crear Nueva Plataforma SaaS'}</DialogTitle>
            <DialogDescription>
              Completa los detalles de la plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto -mx-6 px-6">
            <form id="platform-form" onSubmit={handleSavePlatform} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre de la Plataforma</Label>
                  <Input id="name" name="name" defaultValue={currentPlatform?.name} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Input id="category" name="category" defaultValue={currentPlatform?.category} placeholder="Ej: Restaurante, Ecommerce" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción Corta</Label>
                  <Textarea id="description" name="description" defaultValue={currentPlatform?.description} required rows={3} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select name="status" defaultValue={currentPlatform?.status || 'Active'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Activa</SelectItem>
                      <SelectItem value="Inactive">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border-t pt-4 mt-2 space-y-4">
                    <h4 className="font-semibold text-foreground">Configuración de Comisiones del Partner</h4>
                    <div className="grid gap-2">
                        <Label htmlFor="firstSubscriptionCommission">Comisión por primera suscripción (%)</Label>
                        <Input id="firstSubscriptionCommission" name="firstSubscriptionCommission" type="number" defaultValue={currentPlatform?.firstSubscriptionCommission || 0} required />
                        <p className="text-xs text-muted-foreground">El partner recibe esta comisión una sola vez, cuando el cliente se suscribe por primera vez.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="recurringCommission">Comisión recurrente (%)</Label>
                        <Input id="recurringCommission" name="recurringCommission" type="number" defaultValue={currentPlatform?.recurringCommission || 0} required />
                        <p className="text-xs text-muted-foreground">Comisión que el partner recibe en cada renovación, desde la segunda suscripción en adelante.</p>
                    </div>
                </div>
            </form>
          </div>
          <DialogFooter className="flex-shrink-0">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit" form="platform-form">Guardar Plataforma</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert for Delete */}
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta plataforma?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La plataforma "{platformToDelete?.name}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlatform}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog for Details */}
      <PlatformDetailsDialog 
        platform={platformToView}
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
};

export default function PlatformsPageWrapper() {
    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userData, isLoading } = useDoc(userDocRef);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    // Proteger la ruta para que solo el superadmin pueda acceder
    if (userData?.role !== 'superadmin') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>No tienes permiso para acceder a esta página. Contacta a un administrador.</p>
                </CardContent>
            </Card>
        );
    }

    return <PlatformsPage />;
}
