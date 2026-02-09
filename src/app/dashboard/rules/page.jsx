'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '../../../components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '../../../firebase';
import { collection, doc } from 'firebase/firestore';
import { 
  Gavel, 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2, 
  ShieldAlert, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogTrigger, 
  DialogFooter 
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useToast } from '../../../hooks/use-toast';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from '../../../firebase/non-blocking-updates';

/**
 * @fileOverview Gestión de Reglas y Políticas del Programa de Partners.
 * Solo accesible para el Super Administrador.
 */

export default function RulesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Verificación de rol SuperAdmin
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  // Consulta de reglas globales
  const rulesRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'rules');
  }, [firestore, user?.uid]);

  const { data: rules, isLoading: isRulesLoading } = useCollection(rulesRef);

  // Estado del formulario con validación estricta
  const [formData, setFormData] = React.useState({
    name: '',
    type: 'terms_of_service',
    description: '',
    content: ''
  });

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name || '',
      type: rule.type || 'terms_of_service',
      description: rule.description || '',
      content: rule.content || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!firestore || !formData.name || !formData.type || !formData.content) {
      toast({ 
        variant: "destructive", 
        title: "Validación Fallida", 
        description: "Todos los campos marcados son obligatorios para la integridad del SaaS." 
      });
      return;
    }

    setIsSaving(true);
    try {
      const rulesCol = collection(firestore, 'rules');
      
      if (editingRule) {
        const docRef = doc(firestore, 'rules', editingRule.id);
        updateDocumentNonBlocking(docRef, formData);
        toast({ title: "Regla Actualizada", description: `La normativa "${formData.name}" ha sido modificada.` });
      } else {
        addDocumentNonBlocking(rulesCol, formData);
        toast({ title: "Regla Creada", description: "Nueva política integrada en el sistema de gobernanza." });
      }
      
      setIsDialogOpen(false);
      setEditingRule(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error Crítico", description: "No se pudo sincronizar con el motor de reglas." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (ruleId) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'rules', ruleId);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Regla Eliminada", description: "La normativa ha sido revocada del sistema." });
  };

  if (isUserLoading || isRulesLoading) {
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
          <ShieldAlert className="h-16 w-16 text-destructive opacity-20" />
          <h2 className="text-2xl font-bold">Acceso Denegado</h2>
          <p className="text-muted-foreground max-w-md">Esta sección gestiona las políticas legales y de cumplimiento del SaaS, accesible solo por la Alta Dirección.</p>
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
              <Gavel className="h-8 w-8" /> Reglas y Políticas
            </h1>
            <p className="text-muted-foreground text-sm">Gobernanza global, cumplimiento y términos legales del ecosistema.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => {
                setEditingRule(null);
                setFormData({ name: '', type: 'terms_of_service', description: '', content: '' });
              }}>
                <Plus className="h-4 w-4" /> Crear Regla
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Modificar Política' : 'Nueva Regla del Programa'}</DialogTitle>
                <DialogDescription>Define normativas vinculantes para los partners senior.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre de la Regla</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      placeholder="Ej. Política Anti-Fraude v2" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="terms_of_service">Términos de Servicio</SelectItem>
                        <SelectItem value="anti_fraud">Anti-Fraude</SelectItem>
                        <SelectItem value="compliance">Cumplimiento (Compliance)</SelectItem>
                        <SelectItem value="operational">Operativa Interna</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Breve Descripción</Label>
                  <Input 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    placeholder="Resumen para la administración rápida..." 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contenido Legal / Técnico</Label>
                  <Textarea 
                    value={formData.content} 
                    onChange={(e) => setFormData({...formData, content: e.target.value})} 
                    placeholder="Redacta el contenido íntegro de la regla aquí..." 
                    className="min-h-[250px] font-mono text-xs"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publicar Regla
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          <Card className="border-primary/10 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Cuerpo Normativo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nombre / Descripción</TableHead>
                    <TableHead>Tipo de Política</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules && rules.length > 0 ? (
                    rules.map((rule) => (
                      <TableRow key={rule.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{rule.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[400px]">
                              {rule.description || 'Sin descripción detallada.'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-normal capitalize">
                            {rule.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary" 
                              onClick={() => handleEdit(rule)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                              onClick={() => {
                                if(confirm('¿Confirmas la eliminación de esta política? Esta acción es irreversible.')) {
                                  handleDelete(rule.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground italic">
                          <AlertCircle className="h-8 w-8 opacity-20" />
                          No se han definido reglas de gobernanza aún.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
