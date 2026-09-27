'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Zap, Upload, Loader2, FileText, Check, X, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function ActivationsPage() {
  const { user } = useUser();
  const { storage } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [chargedAmount, setChargedAmount] = React.useState(150000);
  const [selectedReferralId, setSelectedReferralId] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('Transferencia Bancaria');
  const [receiptFile, setReceiptFile] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState(null);

  const partnerKeep = Math.round(Number(chargedAmount || 0) * 0.60);
  const menfyAmount = Math.round(Number(chargedAmount || 0) * 0.40);

  const userDocRef = useMemoFirebase(() => (!firestore || !user?.uid ? null : doc(firestore, 'users', user.uid)), [firestore, user?.uid]);
  const { data: userData } = useDoc(userDocRef);
  const isSuperAdmin = userData?.role === 'superadmin';

  // Solo referidos en estado 'registrado' disponibles para activar
  const refQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return isSuperAdmin ? collection(firestore, 'referrals') : query(collection(firestore, 'referrals'), where('partnerId', '==', user.uid));
  }, [firestore, user?.uid, isSuperAdmin]);
  const { data: rawReferrals } = useCollection(refQuery);

  const availableReferrals = React.useMemo(() => {
    if (!rawReferrals) return [];
    return isSuperAdmin ? rawReferrals : rawReferrals.filter(r => r.status === 'registrado');
  }, [rawReferrals, isSuperAdmin]);

  // Consultar activaciones
  const actQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return isSuperAdmin ? collection(firestore, 'activations') : query(collection(firestore, 'activations'), where('partnerId', '==', user.uid));
  }, [firestore, user?.uid, isSuperAdmin]);
  const { data: rawActivations, isLoading } = useCollection(actQuery);

  const activations = React.useMemo(() => {
    if (!rawActivations) return [];
    return [...rawActivations].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [rawActivations]);

  // 1. FLUJO ADMIN: Registrar activación -> referral pasa a 'pendiente_activacion'
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firestore || !user?.uid || !selectedReferralId) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Selecciona un restaurante registrado." });
      return;
    }
    setIsSubmitting(true);
    try {
      let receiptUrl = '';
      if (receiptFile && storage) {
        const fileRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${receiptFile.name}`);
        const snapshot = await uploadBytes(fileRef, receiptFile);
        receiptUrl = await getDownloadURL(snapshot.ref);
      }
      const now = new Date().toISOString();
      const batch = writeBatch(firestore);

      // Crear activación con status enviado
      const actRef = doc(collection(firestore, 'activations'));
      batch.set(actRef, {
        partnerId: user.uid,
        referralId: selectedReferralId,
        chargedAmount: Number(chargedAmount),
        partnerKeep,
        menfyAmount,
        paymentMethod,
        receiptUrl,
        status: 'enviado',
        submittedAt: now,
        createdAt: now,
      });

      // Actualizar el referral a pendiente_activacion
      const refDoc = doc(firestore, 'referrals', selectedReferralId);
      batch.update(refDoc, { status: 'pendiente_activacion' });

      // Notificar al SuperAdmin
      const superadminQuery = query(collection(firestore, 'users'), where('role', '==', 'superadmin'));
      const superSnap = await getDocs(superadminQuery);
      superSnap.forEach(sDoc => {
        const notifRef = doc(collection(firestore, 'partners', sDoc.id, 'notifications'));
        batch.set(notifRef, {
          title: 'Nueva Activación para Revisar',
          message: `El socio ha solicitado la activación de un restaurante por $${Number(chargedAmount).toLocaleString()}.`,
          timestamp: now,
          read: false,
          type: 'info',
        });
      });

      await batch.commit();
      toast({ title: "Activación Enviada", description: "El restaurante quedó 'Pendiente de Activación' en revisión por SuperAdmin." });
      setSelectedReferralId('');
      setReceiptFile(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo enviar la activación." });
    } finally { setIsSubmitting(false); }
  };

  // 2. FLUJO SUPERADMIN: Verificar -> activar referral + crear transacción + notificar
  const handleVerify = async (a) => {
    if (!firestore || !user || !isSuperAdmin) return;
    setActionLoadingId(a.id);
    try {
      const batch = writeBatch(firestore);
      const now = new Date().toISOString();
      const threeMonths = new Date(Date.now() + 90*24*60*60*1000).toISOString();

      // a) Activación verificada
      batch.update(doc(firestore, 'activations', a.id), { status: 'verificado', verifiedAt: now });

      // b) Referral activo con fechas
      if (a.referralId) {
        batch.update(doc(firestore, 'referrals', a.referralId), {
          status: 'activo',
          activatedAt: now,
          recurringEndsAt: threeMonths,
        });
      }

      // c) Crear transacción aprobada
      const txRef = doc(collection(firestore, 'transactions'));
      batch.set(txRef, {
        partnerId: a.partnerId,
        referralId: a.referralId || '',
        type: 'activacion',
        baseAmount: Number(a.chargedAmount),
        commissionPct: 60,
        commissionValue: Number(a.partnerKeep),
        status: 'aprobado',
        period: now.slice(0, 7),
        approvedBy: user.email || 'SuperAdmin',
        approvedAt: now,
        createdAt: now,
        description: 'Comisión 60% activación aprobada'
      });

      // d) Notificar al socio
      const notifRef = doc(collection(firestore, 'partners', a.partnerId, 'notifications'));
      batch.set(notifRef, {
        title: '¡Activación Verificada y Aprobada!',
        message: `Tu activación fue aprobada. Se acreditó tu comisión del 60% ($${Number(a.partnerKeep).toLocaleString()}).`,
        timestamp: now,
        read: false,
        type: 'success',
      });

      await batch.commit();
      toast({ title: "Activación Verificada", description: "Restaurante activado y comisión aprobada exitosamente." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo verificar la activación." });
    } finally { setActionLoadingId(null); }
  };

  // 3. FLUJO SUPERADMIN: Rechazar -> revertir referral a registrado + notificar
  const handleReject = async (a) => {
    if (!firestore || !user || !isSuperAdmin) return;
    setActionLoadingId(a.id);
    try {
      const batch = writeBatch(firestore);
      const now = new Date().toISOString();

      batch.update(doc(firestore, 'activations', a.id), { status: 'rechazado' });
      if (a.referralId) {
        batch.update(doc(firestore, 'referrals', a.referralId), { status: 'registrado' });
      }

      const notifRef = doc(collection(firestore, 'partners', a.partnerId, 'notifications'));
      batch.set(notifRef, {
        title: 'Activación Rechazada',
        message: 'Tu activación fue rechazada por el SuperAdmin. Por favor verifica el comprobante o los montos y vuelve a intentarlo.',
        timestamp: now,
        read: false,
        type: 'alert',
      });

      await batch.commit();
      toast({ title: "Activación Rechazada", description: "El restaurante volvió a estado registrado." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo rechazar la activación." });
    } finally { setActionLoadingId(null); }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
            <Zap className="h-8 w-8 text-amber-500" /> Activar Negocio
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {isSuperAdmin 
              ? 'Auditoría y verificación de activaciones enviadas por socios comerciales.' 
              : 'Registra el cobro de activación de tus restaurantes referidos para revisión de SuperAdmin.'}
          </p>
        </div>

        {/* Formulario solo para el socio o SuperAdmin */}
        {!isSuperAdmin && (
          <Card className="border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase text-primary">Registrar Cobro de Activación</CardTitle>
              <CardDescription>
                El sistema calcula tu 60% de ganancia. Al enviar, el restaurante pasará a "Pendiente de Activación" hasta la confirmación de SuperAdmin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Restaurante Referido</label>
                    <Select value={selectedReferralId} onValueChange={setSelectedReferralId}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona un restaurante..." /></SelectTrigger>
                      <SelectContent>
                        {availableReferrals.length > 0 ? availableReferrals.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.restaurantName} ({r.plan})</SelectItem>
                        )) : <SelectItem value="none" disabled>No tienes restaurantes en estado 'Registrado'</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Monto Cobrado ($)</label>
                    <Input type="number" required className="mt-1" value={chargedAmount} onChange={(e) => setChargedAmount(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase">Tu Comisión (60%)</div>
                    <div className="text-2xl font-black text-emerald-600 mt-0.5">+${partnerKeep.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase">Pago a Menfy (40%)</div>
                    <div className="text-2xl font-black text-primary mt-0.5">${menfyAmount.toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Método de Pago</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                        <SelectItem value="Nequi / Daviplata">Nequi / Daviplata</SelectItem>
                        <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Comprobante de Pago (Storage)</label>
                    <Input type="file" className="mt-1 cursor-pointer" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSubmitting} className="font-bold gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isSubmitting ? 'Enviando...' : 'Enviar a Verificación'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tabla de Activaciones con permisos estrictos */}
        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center justify-between">
              <span>{isSuperAdmin ? 'Panel de Verificación de Activaciones' : 'Mis Activaciones'} ({activations.length})</span>
              {isSuperAdmin && <Badge variant="secondary" className="gap-1 font-bold text-xs"><ShieldCheck className="h-3.5 w-3.5 text-purple-600" /> Modo SuperAdmin</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cobrado</TableHead>
                    <TableHead>Comisión 60%</TableHead>
                    <TableHead>Menfy 40%</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Estado</TableHead>
                    {isSuperAdmin && <TableHead className="text-right pr-6">Acciones de Verificación</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activations.length > 0 ? activations.map(a => {
                    const isPending = a.status === 'enviado';
                    return (
                      <TableRow key={a.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs">{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="font-bold text-xs">${Number(a.chargedAmount || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-black text-xs text-emerald-600">${Number(a.partnerKeep || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-bold text-xs text-primary">${Number(a.menfyAmount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{a.paymentMethod}</TableCell>
                        <TableCell>
                          {a.receiptUrl ? (
                            <a href={a.receiptUrl} target="_blank" rel="noreferrer" className="text-primary text-xs underline font-bold flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Ver Recibo
                            </a>
                          ) : <span className="text-xs text-muted-foreground italic">Sin archivo</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] uppercase font-bold ${
                            a.status === 'verificado'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : a.status === 'rechazado'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}>
                            {a.status === 'enviado' ? 'En revisión' : a.status}
                          </Badge>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-right pr-6">
                            {isPending && (
                              <div className="flex justify-end gap-1.5">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleVerify(a)}
                                  disabled={actionLoadingId === a.id}
                                  className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 gap-1 h-7 px-2"
                                >
                                  {actionLoadingId === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                  Verificar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleReject(a)}
                                  disabled={actionLoadingId === a.id}
                                  className="font-bold text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 h-7 px-2"
                                >
                                  <X className="h-3 w-3" />
                                  Rechazar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  }) : <TableRow><TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-12 italic text-muted-foreground">Sin activaciones registradas.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
