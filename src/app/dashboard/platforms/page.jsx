'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '../../../components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '../../../firebase';
import { collection, doc } from 'firebase/firestore';
import { 
  Puzzle, 
  Plus, 
  Edit3, 
  Loader2, 
  CheckCircle2, 
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useToast } from '../../../hooks/use-toast';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '../../../firebase/non-blocking-updates';

/**
 * @fileOverview Gestión de Plataformas SaaS para SuperAdmin.
 * Implementa CRUD de servicios de afiliación con validación de rol y rutas relativas.
 */

export default function PlatformsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPlatform, setEditingPlatform] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Verificación de rol SuperAdmin
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  // Consulta de plataformas
  const platformsRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'saasPlatforms');
  }, [firestore, user?.uid]);

  const { data: platforms, isLoading: isPlatformsLoading } = useCollection(platformsRef);

  const [formData, setFormData] = React.useState({
    name: '',
    category: '',
    description: '',
    status: 'Active',
    baseCommission: 0,
    recurringCommission: 0
  });

  const handleEdit = (platform) => {
    setEditingPlatform(platform);
    setFormData({
      name: platform.name || '',
      category: platform.category || '',
      description: platform.description || '',
      status: platform.status || 'Active',
      baseCommission: platform.baseCommission || 0,
      recurringCommission: platform.recurringCommission || 0
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!firestore || !formData.name || !formData.category) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Nombre y categoría son obligatorios." });
      return;
    }

    setIsSaving(true);
    try {
      const platformsCol = collection(firestore, 'saasPlatforms');
      
      if (editingPlatform) {
        const docRef = doc(firestore, 'saasPlatforms', editingPlatform.id);
        updateDocumentNonBlocking(docRef, formData);
        toast({ title: "Plataforma Actualizada", description: `${formData.name} se ha guardado correctamente.` });
      } else {
        addDocumentNonBlocking(platformsCol, formData);
        toast({ title: "Plataforma Creada", description: "El nuevo SaaS ha sido añadido al catálogo." });
      }
      
      setIsDialogOpen(false);
      setEditingPlatform(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || isPlatformsLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const isSuperAdmin = userData?.role === 'superadmin';

  if (!isSuperAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
          <XCircle className="h-16 w-16 text-destructive opacity-20" />
          <h2 className="text-2xl font-bold">Acceso Denegado</h2>
          <p className="text-muted-foreground max-w-md">Sección exclusiva para el Super Administrador.</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
              <Puzzle className="h-8 w-8" /> Plataformas SaaS
            </h1>
            <p className="text-muted-foreground text-sm">Catálogo de software y esquemas de comisiones globales.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => {
                setEditingPlatform(null);
                setFormData({
                  name: '', category: '', description: '', status: 'Active',
                  baseCommission: 0, recurringCommission: 0
                });
              }}>
                <Plus className="h-4 w-4" /> Nueva Plataforma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingPlatform ? 'Editar Plataforma' : 'Crear Nueva Plataforma SaaS'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del SaaS</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Input 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Activo</SelectItem>
                        <SelectItem value="Inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Base (%)</Label>
                    <Input 
                      type="number" 
                      value={formData.baseCommission} 
                      onChange={(e) => setFormData({...formData, baseCommission: Number(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Recurrente (%)</Label>
                    <Input 
                      type="number" 
                      value={formData.recurringCommission} 
                      onChange={(e) => setFormData({...formData, recurringCommission: Number(e.target.value)})} 
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Catálogo Maestro</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>SaaS</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Base</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms && platforms.length > 0 ? (
                  platforms.map((platform) => (
                    <TableRow key={platform.id}>
                      <TableCell className="font-bold">{platform.name}</TableCell>
                      <TableCell>{platform.category}</TableCell>
                      <TableCell>
                        <Badge variant={platform.status === 'Active' ? 'default' : 'destructive'}>
                          {platform.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{platform.baseCommission}%</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(platform)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">No hay plataformas.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
