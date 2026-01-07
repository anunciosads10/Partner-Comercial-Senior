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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Puzzle, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const PlatformStatusBadge = ({ status }) => {
  const variant = status === 'Active' ? 'default' : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
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

  const openNewDialog = () => {
    setCurrentPlatform(null);
    setDialogOpen(true);
  };

  const openEditDialog = (platform) => {
    setCurrentPlatform(platform);
    setDialogOpen(true);
  };

  const openDeleteAlert = (platform) => {
    setPlatformToDelete(platform);
    setAlertOpen(true);
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => openEditDialog(platform)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
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
        <DialogContent className="sm:max-w-[525px]">
          <form onSubmit={handleSavePlatform}>
            <DialogHeader>
              <DialogTitle>{currentPlatform ? 'Editar Plataforma SaaS' : 'Crear Nueva Plataforma SaaS'}</DialogTitle>
              <DialogDescription>
                Completa los detalles de la plataforma.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Guardar Plataforma</Button>
            </DialogFooter>
          </form>
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
