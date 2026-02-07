'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Download, Clock, CreditCard, Loader2, CheckCircle, PlusCircle } from "lucide-react";
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
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, doc, addDoc, query, where, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { addMonths, format, setDate, nextDay, getDay, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const PaymentStatusBadge = ({ status }) => {
  const getVariant = () => {
    switch (status) {
      case 'Pagado': return 'default';
      case 'Pendiente': return 'secondary';
      case 'Fallido': return 'destructive';
      default: return 'outline';
    }
  };
  return <Badge variant={getVariant()}>{status}</Badge>;
};

const calculateNextPaymentDate = (settings) => {
    if (!settings?.frequency || !settings?.paymentDay) return "No configurado";
    const { frequency, paymentDay } = settings;
    const today = new Date();
    const day = parseInt(paymentDay, 10);
    let nextDate;
    switch (frequency) {
        case 'monthly':
            const paymentDateThisMonth = setDate(today, day);
            nextDate = isAfter(today, paymentDateThisMonth) ? addMonths(paymentDateThisMonth, 1) : paymentDateThisMonth;
            break;
        case 'weekly':
            nextDate = todayDay === (day % 7) && today.getHours() < 1 ? today : nextDay(today, day % 7);
            break;
        case 'biweekly':
            const paymentDateFirst = setDate(today, 15);
            if (isAfter(today, paymentDateFirst)) {
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                nextDate = isAfter(today, endOfMonth) ? setDate(addMonths(today, 1), 15) : endOfMonth;
            } else {
                nextDate = paymentDateFirst;
            }
            break;
        default: return "Frecuencia no válida";
    }
    return format(nextDate, "d 'de' MMMM 'de' yyyy", { locale: es });
};

export default function PaymentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [paymentToPay, setPaymentToPay] = React.useState(null);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [isNewPaymentDialogOpen, setNewPaymentDialogOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  const [newPaymentData, setNewPaymentData] = React.useState({
    partnerId: '',
    amount: '',
    description: ''
  });

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userDocRef);
  const { role, uid } = userData || {};

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (role === 'superadmin') return collection(firestore, 'payments');
    if (role === 'admin' && uid) return query(collection(firestore, 'payments'), where('partnerId', '==', uid));
    return null;
  }, [firestore, role, uid]);
  
  const { data: payments, isLoading: arePaymentsLoading } = useCollection(paymentsQuery);
  const partnersCollectionRef = useMemoFirebase(() => firestore && role === 'superadmin' ? collection(firestore, 'partners') : null, [firestore, role]);
  const { data: partners, isLoading: arePartnersLoading } = useCollection(partnersCollectionRef);
  
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'paymentCycles') : null, [firestore]);
  const { data: paymentSettings, isLoading: areSettingsLoading } = useDoc(settingsRef);

  const nextPaymentDate = React.useMemo(() => isMounted ? calculateNextPaymentDate(paymentSettings) : "Cargando...", [paymentSettings, isMounted]);

  const totalPaid = payments?.filter(p => p.status === 'Pagado').reduce((acc, p) => acc + p.amount, 0) || 0;
  const totalPending = payments?.filter(p => p.status === 'Pendiente').reduce((acc, p) => acc + p.amount, 0) || 0;
  
  const handleExport = () => {
    if (!payments?.length) {
      toast({ variant: "destructive", title: "No hay datos para exportar" });
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,ID Transacción,Partner,Fecha Creación,Fecha Pago,Monto,Estado,Descripción\r\n";
    payments.forEach(p => {
      csvContent += `${p.id},${p.partnerName || 'N/A'},${new Date(p.paymentDate).toLocaleDateString()},${p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'},${p.amount},${p.status},"${p.description || ''}"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "reporte_de_pagos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Reporte Generado" });
  };

  const handleNewPaymentSubmit = (e) => {
    e.preventDefault();
    if (!firestore || !newPaymentData.partnerId || !newPaymentData.amount) return;
    
    const selectedPartner = partners.find(p => p.id === newPaymentData.partnerId);
    const paymentData = {
        amount: Number(newPaymentData.amount),
        description: newPaymentData.description || 'Pago de comisión',
        paymentDate: new Date().toISOString(),
        status: 'Pendiente',
        partnerId: selectedPartner.id,
        partnerName: selectedPartner.name,
    };

    addDocumentNonBlocking(collection(firestore, 'payments'), paymentData);
    toast({ title: "Pago Iniciado", description: "El pago se está procesando en segundo plano." });
    setNewPaymentDialogOpen(false);
    setNewPaymentData({ partnerId: '', amount: '', description: '' });
  };

  const confirmPayment = () => {
    if (!paymentToPay || !firestore || !user) return;
    const paymentRef = doc(firestore, 'payments', paymentToPay.id);
    updateDocumentNonBlocking(paymentRef, {
        status: 'Pagado',
        paidAt: new Date().toISOString(),
        paidBy: user.uid,
    });
    toast({ title: "Pago Confirmado", description: "El estado se actualizará en breve." });
    setAlertOpen(false);
    setPaymentToPay(null);
  };

  const isLoading = isRoleLoading || arePaymentsLoading || (role === 'superadmin' && arePartnersLoading) || areSettingsLoading;

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pagos y Facturación</CardTitle>
              <CardDescription>Consulta tu historial de comisiones pagadas y pendientes.</CardDescription>
            </div>
            {role === 'superadmin' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
                <Dialog open={isNewPaymentDialogOpen} onOpenChange={setNewPaymentDialogOpen}>
                  <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Pago</Button></DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleNewPaymentSubmit} className="space-y-4">
                      <DialogHeader><DialogTitle>Crear Nuevo Pago</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                          <Label>Partner</Label>
                          <Select value={newPaymentData.partnerId} onValueChange={(v) => setNewPaymentData({ ...newPaymentData, partnerId: v })}>
                            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                            <SelectContent>{partners?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Monto</Label>
                          <Input type="number" value={newPaymentData.amount} onChange={(e) => setNewPaymentData({ ...newPaymentData, amount: e.target.value })} required />
                        </div>
                        <div className="grid gap-2"><Label>Descripción</Label><Textarea value={newPaymentData.description} onChange={(e) => setNewPaymentData({ ...newPaymentData, description: e.target.value })} /></div>
                      </div>
                      <DialogFooter><Button type="submit">Crear Pago</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <KpiCard title="Total Pagado" value={isLoading ? "..." : `$${totalPaid.toLocaleString()}`} Icon={DollarSign} />
            <KpiCard title="Pagos Pendientes" value={isLoading ? "..." : `$${totalPending.toLocaleString()}`} Icon={Clock} />
            <KpiCard title="Próximo Ciclo" value={isLoading ? "..." : nextPaymentDate} Icon={CreditCard} />
          </div>
          <Card>
            <CardHeader><CardTitle>Historial</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    {role === 'superadmin' && <TableHead>Partner</TableHead>}
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    {role === 'superadmin' && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono">{payment.id}</TableCell>
                      {role === 'superadmin' && <TableCell>{payment.partnerName}</TableCell>}
                      <TableCell className="font-semibold">${payment.amount.toLocaleString()}</TableCell>
                      <TableCell><PaymentStatusBadge status={payment.status} /></TableCell>
                      {role === 'superadmin' && (
                        <TableCell className="text-right">
                          {payment.status === 'Pendiente' ? <Button size="sm" onClick={() => { setPaymentToPay(payment); setAlertOpen(true); }}>Pagar</Button> : <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Pago</AlertDialogTitle><AlertDialogDescription>¿Marcar como pagado el monto de ${paymentToPay?.amount.toLocaleString()}?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmPayment}>Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
