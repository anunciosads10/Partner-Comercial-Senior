'use client';
import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { DollarSign, Clock, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function EarningsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (!firestore || !user?.uid ? null : doc(firestore, 'users', user.uid)), [firestore, user?.uid]);
  const { data: userData } = useDoc(userDocRef);
  const isSuperAdmin = userData?.role === 'superadmin';

  const txQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return isSuperAdmin ? collection(firestore, 'transactions') : query(collection(firestore, 'transactions'), where('partnerId', '==', user.uid));
  }, [firestore, user?.uid, isSuperAdmin]);

  const { data: rawTx, isLoading } = useCollection(txQuery);
  const transactions = React.useMemo(() => {
    if (!rawTx) return [];
    return [...rawTx].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [rawTx]);

  const metrics = React.useMemo(() => {
    if (!rawTx) return { monthly: 0, pending: 0, total: 0 };
    const curMonth = new Date().toISOString().slice(0, 7);
    let monthly = 0, pending = 0, total = 0;
    rawTx.forEach(t => {
      const val = Number(t.commissionValue || 0);
      if (t.status === 'aprobado') { total += val; if (t.createdAt?.startsWith(curMonth)) monthly += val; }
      else if (t.status === 'pendiente') { pending += val; }
    });
    return { monthly, pending, total };
  }, [rawTx]);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3"><DollarSign className="h-8 w-8" /> Mis Ingresos</h1>
          <p className="text-muted-foreground text-sm font-medium">Control de comisiones y pagos por activaciones y recurrentes.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/10 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Ganado Este Mes</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-emerald-600">${metrics.monthly.toLocaleString()}</div></CardContent></Card>
          <Card className="border-primary/10 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Comisiones Pendientes</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-amber-600">${metrics.pending.toLocaleString()}</div></CardContent></Card>
          <Card className="border-primary/10 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Total Histórico</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-primary">${metrics.total.toLocaleString()}</div></CardContent></Card>
        </div>
        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4"><CardTitle className="text-lg font-black uppercase">Transacciones ({transactions.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Tipo</TableHead><TableHead>Base</TableHead><TableHead>%</TableHead><TableHead>Comisión</TableHead><TableHead className="text-right">Estado</TableHead></TableRow></TableHeader>
                <TableBody>
                  {transactions.length > 0 ? transactions.map(t => (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="font-bold text-xs">{t.description || 'Comisión activación'}</TableCell>
                      <TableCell><Badge variant="outline" className="uppercase text-[10px]">{t.type || 'activacion'}</Badge></TableCell>
                      <TableCell className="text-xs">${Number(t.baseAmount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-black text-primary">{t.commissionPct || 60}%</TableCell>
                      <TableCell className="text-sm font-black text-emerald-600">+${Number(t.commissionValue || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right"><Badge className="uppercase text-[10px] font-bold">{t.status || 'pendiente'}</Badge></TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={7} className="text-center py-12 italic text-muted-foreground">Sin transacciones registradas.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
