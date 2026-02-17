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
  XCircle,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useToast } from '../../../hooks/use-toast';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '../../../firebase/non-blocking-updates';

/**
 * @fileOverview Gestión de Plataformas SaaS para SuperAdmin.
 * Implementa CRUD con motor de búsqueda y filtrado inteligente.
 */

export default function PlatformsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPlatform, setEditingPlatform] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Estados de búsqueda y filtrado
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');

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

  // Lógica de filtrado reactivo
  const filteredPlatforms = React.useMemo(() => {
    if (!platforms) return [];
    return platforms.filter(p => {
      const matchesSearch = !searchQuery || 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [platforms, searchQuery, statusFilter, categoryFilter]);

  // Obtener categorías únicas para el filtro
  const categories = React.useMemo(() => {
    if (!platforms) return [];
    return Array.from(new Set(platforms.map(p => p.category).filter(Boolean)));
  }, [platforms]);

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

  const closeDialog = React.useCallback(() => {
    setIsDialogOpen(false);
    setEditingPlatform(null);
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.body.removeAttribute('data-scroll-locked');
    }
  }, []);

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
      
      closeDialog();
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
            <p className="text-muted-foreground text-sm font-medium">Catálogo de software y esquemas de comisiones globales.</p>
          </div>
          
          <Button className="gap-2 font-bold shadow-lg" onClick={() => {
            setEditingPlatform(null);
            setFormData({
              name: '', category: '', description: '', status: 'Active',
              baseCommission: 0, recurringCommission: 0
            });
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4" /> Nueva Plataforma
          </Button>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-primary/10 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o descripción..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-3 h-3 mr-2 opacity-50" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Categorías</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Estados</SelectItem>
                <SelectItem value="Active">Activos</SelectItem>
                <SelectItem value="Inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/5 border-b">
            <CardTitle className="text-lg uppercase font-black text-primary tracking-tight">Catálogo Maestro ({filteredPlatforms.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>SaaS</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Base (%)</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlatforms.length > 0 ? (
                  filteredPlatforms.map((platform) => (
                    <TableRow key={platform.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase tracking-tight">{platform.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{platform.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{platform.category}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={platform.status === 'Active' ? 'default' : 'destructive'}
                          className="text-[10px] uppercase font-black px-3"
                        >
                          {platform.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-black text-primary font-mono">{platform.baseCommission}%</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => handleEdit(platform)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                      No se encontraron plataformas que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal de Edición/Creación */}
        {isDialogOpen && (
          <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"
            onClick={closeDialog}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b bg-muted/10">
                <h2 className="text-xl font-black uppercase tracking-tight text-primary">
                  {editingPlatform ? 'Actualizar Plataforma' : 'Nueva Plataforma SaaS'}
                </h2>
                <p className="text-sm text-muted-foreground">Define los parámetros de afiliación del ecosistema.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del SaaS</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      placeholder="Ej. Restaurante POS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Input 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})} 
                      placeholder="Ej. Gastronomía"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción Comercial</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    className="h-24"
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
              <div className="flex justify-end gap-3 p-6 border-t bg-muted/10">
                <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Plataforma
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
