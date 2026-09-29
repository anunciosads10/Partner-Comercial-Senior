'use client';
import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { UserPlus, Search, Filter, Loader2, Store, Plus, X, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function ReferralsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({ restaurantName: '', restaurantPhone: '', restaurantEmail: '', plan: 'Pro Mensual', planValue: 150000, notes: '' });

  const userDocRef = useMemoFirebase(() => (!firestore || !user?.uid ? null : doc(firestore, 'users', user.uid)), [firestore, user?.uid]);
  const { data: userData } = useDoc(userDocRef);
  const isSuperAdmin = userData?.role === 'superadmin';

  const refQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return isSuperAdmin ? collection(firestore, 'referrals') : query(collection(firestore, 'referrals'), where('partnerId', '==', user.uid));
  }, [firestore, user?.uid, isSuperAdmin]);

  const { data: rawData, isLoading } = useCollection(refQuery);
  const referrals = React.useMemo(() => {
    if (!rawData) return [];
    return rawData.filter(r => {
      const matchSearch = !searchQuery || r.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase()) || r.restaurantEmail?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    }).sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [rawData, searchQuery, statusFilter]);

    const handleDeleteReferral = async (r) => {
    if (!firestore || !isSuperAdmin) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${r.restaurantName}"?`)) return;
    try {
      await deleteDoc(doc(firestore, 'referrals', r.id));
      toast({ title: "Referido Eliminado", description: `"${r.restaurantName}" ha sido eliminado con éxito.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el referido." });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!firestore || !user?.uid) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'referrals'), {
        partnerId: user.uid,
        ...formData,
        planValue: Number(formData.planValue),
        status: 'registrado',
        referralCode: user.uid.substring(0, 8).toUpperCase(),
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Referido Creado", description: "Restaurante guardado exitosamente." });
      setIsModalOpen(false);
      setFormData({ restaurantName: '', restaurantPhone: '', restaurantEmail: '', plan: 'Pro Mensual', planValue: 150000, notes: '' });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar el referido." });
    } finally { setIsSubmitting(false); }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3"><UserPlus className="h-8 w-8" /> Mis Referidos</h1>
            <p className="text-muted-foreground text-sm font-medium">Control de restaurantes y comisiones recurrentes.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 font-bold shadow-sm"><Plus className="h-4 w-4" /> Registrar Referido</Button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-primary/10 shadow-sm">
          <Input placeholder="Buscar por restaurante o email..." className="flex-1 shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] shadow-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="registrado">Registrado</SelectItem>
              <SelectItem value="pendiente_activacion">Pendiente Activación</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="pagado">Pagado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4"><CardTitle className="text-lg font-black uppercase">Restaurantes ({referrals.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead>Restaurante</TableHead><TableHead>Contacto</TableHead><TableHead>Plan</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Fin Recurrente</TableHead>{isSuperAdmin && <TableHead className="text-right pr-6">Acción</TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {referrals.length > 0 ? referrals.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold flex items-center gap-2"><Store className="h-4 w-4 text-primary" />{r.restaurantName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground"><div>{r.restaurantEmail}</div><div>{r.restaurantPhone}</div></TableCell>
                      <TableCell><div className="font-bold text-xs">{r.plan}</div><div className="text-xs text-primary font-bold">${r.planValue?.toLocaleString()}</div></TableCell>
                      <TableCell><Badge variant="outline" className="uppercase text-[10px] font-bold">{r.status || 'registrado'}</Badge></TableCell>
                      <TableCell className="text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold text-primary">{r.recurringEndsAt ? new Date(r.recurringEndsAt).toLocaleDateString() : 'Pendiente'}</TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right pr-6">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-700" 
                            onClick={() => handleDeleteReferral(r)}
                            title="Eliminar Referido"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={6} className="text-center py-12 italic text-muted-foreground">Sin referidos aún.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-4"><h3 className="font-black uppercase text-primary">Nuevo Referido</h3><button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5" /></button></div>
              <form onSubmit={handleCreate} className="space-y-3">
                <Input required placeholder="Nombre del Restaurante" value={formData.restaurantName} onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })} />
                <Input required placeholder="Teléfono" value={formData.restaurantPhone} onChange={(e) => setFormData({ ...formData, restaurantPhone: e.target.value })} />
                <Input required type="email" placeholder="Email" value={formData.restaurantEmail} onChange={(e) => setFormData({ ...formData, restaurantEmail: e.target.value })} />
                <Input type="number" required placeholder="Valor del Plan" value={formData.planValue} onChange={(e) => setFormData({ ...formData, planValue: e.target.value })} />
                <Input placeholder="Notas adicionales" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
