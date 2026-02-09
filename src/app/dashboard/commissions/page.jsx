'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { 
  Percent, 
  Plus, 
  Edit3, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  DollarSign,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * @fileOverview Gestión de Esquemas de Comisiones para SuperAdmin.
 * Permite definir las reglas de negocio globales para la repartición de ingresos.
 */

export default function CommissionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingScheme, setEditingScheme] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Verificación de rol SuperAdmin
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  // Consulta de esquemas de comisión
  const schemesRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'commission_schemes');
  }, [firestore, user?.uid]);

  const { data: schemes, isLoading: isSchemesLoading } = useCollection(schemesRef);

  // Estado del formulario
  const [formData, setFormData] = React.useState({
    name: '',
    type: 'percentage',
    rate: 0,
    description: ''
  });

  const handleEdit = (scheme) => {
    setEditingScheme(scheme);
    setFormData({
      name: scheme.name || '',
      type: scheme.type || 'percentage',
      rate: scheme.rate || 0,
      description: scheme.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!firestore || !formData.name || !formData.type) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "El nombre y tipo son obligatorios." });
      return;
    }

    setIsSaving(true);
    try {
      const schemesCol = collection(firestore, 'commission_schemes');
      
      if (editingScheme) {
        const docRef = doc(firestore, 'commission_schemes', editingScheme.id);
        updateDocumentNonBlocking(docRef, formData);
        toast({ title: "Esquema Actualizado", description: `El esquema ${formData.name} ha sido modificado.` });
      } else {
        await addDocumentNonBlocking(schemesCol, formData);
        toast({ title: "Esquema Creado", description: "Nuevo modelo de comisiones activado." });
      }
      
      setIsDialogOpen(false);
      setEditingScheme(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la solicitud." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || isSchemesLoading) {
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
          <h2 className="text-2xl font-bold">Acceso Restringido</h2>
          <p className="text-muted-foreground max-w-md">Solo el personal de alta gerencia puede configurar los parámetros de liquidación de comisiones.</p>
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
              <Percent className="h-8 w-8" /> Comisiones
            </h1>
            <p className="text-muted-foreground text-sm">Configuración de modelos de negocio y tasas de retorno globales.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => {
                setEditingScheme(null);
                setFormData({ name: '', type: 'percentage', rate: 0, description: '' });
              }}>
                <Plus className="h-4 w-4" /> Crear Modelo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingScheme ? 'Modificar Esquema' : 'Nuevo Esquema de Comisión'}</DialogTitle>
                <DialogDescription>Define los parámetros que regirán los pagos a la red de partners.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre del Esquema</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="Ej. Plan Diamante 2024" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                        <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                        <SelectItem value="tiered">Por Niveles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tasa / Valor</Label>
                    <Input 
                      type="number" 
                      value={formData.rate} 
                      onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción de Reglas</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    placeholder="Detalla las condiciones de este esquema..." 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-primary/10 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Tasa Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">18.5%</div>
              <p className="text-[10px] text-muted-foreground uppercase mt-1">Global de la plataforma</p>
            </CardContent>
          </Card>
          <Card className="border-accent/10 bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" /> Retorno Máximo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">35%</div>
              <p className="text-[10px] text-muted-foreground uppercase mt-1">Esquemas VIP activos</p>
            </CardContent>
          </Card>
          <Card className="border-muted bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" /> Modelos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schemes?.length || 0}</div>
              <p className="text-[10px] text-muted-foreground uppercase mt-1">Configuraciones en uso</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Esquemas de Liquidación</CardTitle>
            <CardDescription>Definiciones maestras de ingresos para la red de socios.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nombre del Esquema</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Tasa / Valor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemes && schemes.length > 0 ? (
                  schemes.map((scheme) => (
                    <TableRow key={scheme.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{scheme.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">{scheme.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-normal capitalize">
                          {scheme.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-xs font-black text-primary">
                          {scheme.type === 'percentage' ? `${scheme.rate}%` : `$${scheme.rate}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEdit(scheme)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                      No se han configurado esquemas de comisión aún.
                    </TableCell>
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
