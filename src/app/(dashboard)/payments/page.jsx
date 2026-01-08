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
import { collection, doc, addDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import React from "react";

const PaymentStatusBadge = ({ status }) => {
  const getVariant = () => {
    switch (status) {
      case 'Pagado':
        return 'default';
      case 'Pendiente':
        return 'secondary';
      case 'Fallido':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return <Badge variant={getVariant()}>{status}</Badge>;
};

export default function PaymentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // State for dialogs
  const [paymentToPay, setPaymentToPay] = React.useState(null);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [isNewPaymentDialogOpen, setNewPaymentDialogOpen] = React.useState(false);

  // State for new payment form
  const [newPaymentData, setNewPaymentData] = React.useState({
    partnerId: '',
    amount: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userDocRef);
  const { role, uid } = userData || {};

  // Query for payments based on user role
  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (role === 'superadmin') {
        return collection(firestore, 'payments');
    }
    if (role === 'admin' && uid) {
        return query(collection(firestore, 'payments'), where('partnerId', '==', uid));
    }
    return null;
  }, [firestore, role, uid]);
  
  const { data: payments, isLoading: arePaymentsLoading } = useCollection(paymentsQuery);

  // Query for partners to populate the select dropdown
  const partnersCollectionRef = useMemoFirebase(() => firestore && role === 'superadmin' ? collection(firestore, 'partners') : null, [firestore, role]);
  const { data: partners, isLoading: arePartnersLoading } = useCollection(partnersCollectionRef);

  const totalPaid = payments?.filter(p => p.status === 'Pagado').reduce((acc, p) => acc + p.amount, 0) || 0;
  const totalPending = payments?.filter(p => p.status === 'Pendiente').reduce((acc, p) => acc + p.amount, 0) || 0;
  
  const handleExport = () => {
    if (!payments || payments.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay datos para exportar",
      });
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["ID Transacción", "Partner", "Fecha", "Monto", "Estado", "Descripción"];
    csvContent += headers.join(",") + "\r\n";

    payments.forEach(payment => {
      const row = [
        payment.id,
        payment.partnerName || 'N/A',
        new Date(payment.paymentDate).toLocaleDateString(),
        payment.amount,
        payment.status,
        `"${payment.description || ''}"`
      ];
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_de_pagos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Reporte Generado" });
  };

  const handleNewPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!firestore || !newPaymentData.partnerId || !newPaymentData.amount) {
        toast({ variant: "destructive", title: "Error", description: "Por favor, selecciona un partner y un monto." });
        return;
    }
    
    setIsSubmitting(true);
    const selectedPartner = partners.find(p => p.id === newPaymentData.partnerId);

    try {
        const paymentData = {
            amount: Number(newPaymentData.amount),
            description: newPaymentData.description || 'Pago de comisión',
            paymentDate: new Date().toISOString(),
            status: 'Pendiente',
            partnerId: selectedPartner.id,
            partnerName: selectedPartner.name,
        };

        await addDoc(collection(firestore, 'payments'), paymentData);
        
        toast({
            title: "Pago Creado",
            description: `Se ha creado un pago pendiente de $${paymentData.amount} para ${selectedPartner.name}.`,
        });
        
        setNewPaymentDialogOpen(false);
        setNewPaymentData({ partnerId: '', amount: '', description: '' });

    } catch (error) {
        console.error("Error creando el pago:", error);
        toast({ variant: "destructive", title: "Error al crear pago" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const openPayDialog = (payment) => {
    setPaymentToPay(payment);
    setAlertOpen(true);
  };
  
  const confirmPayment = async () => {
    if (!paymentToPay || !firestore || !user) return;

    const paymentRef = doc(firestore, 'payments', paymentToPay.id);

    try {
        await updateDoc(paymentRef, {
            status: 'Pagado',
            paidAt: new Date().toISOString(),
            paidBy: user.uid,
        });
        toast({
            title: "Pago Confirmado",
            description: `El pago para ${paymentToPay.partnerName} ha sido marcado como "Pagado".`
        });
    } catch (error) {
        console.error("Error al marcar como pagado:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado del pago." });
    } finally {
        setAlertOpen(false);
        setPaymentToPay(null);
    }
  };

  const isLoading = isRoleLoading || arePaymentsLoading || (role === 'superadmin' && arePartnersLoading);

  return (
    <>
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pagos y Facturación</CardTitle>
              <CardDescription>
                {role === 'superadmin' 
                  ? "Configura ciclos de pago y visualiza el historial de pagos."
                  : "Consulta tu historial de comisiones pagadas y pendientes."}
              </CardDescription>
            </div>
            {role === 'superadmin' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Reporte
                </Button>
                <Dialog open={isNewPaymentDialogOpen} onOpenChange={setNewPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Iniciar Nuevo Pago
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleNewPaymentSubmit}>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Pago</DialogTitle>
                        <DialogDescription>
                          Selecciona un partner y el monto a pagar. El pago se creará como "Pendiente".
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="partner">Partner</Label>
                          <Select
                            value={newPaymentData.partnerId}
                            onValueChange={(value) => setNewPaymentData({ ...newPaymentData, partnerId: value })}
                          >
                            <SelectTrigger id="partner">
                              <SelectValue placeholder={arePartnersLoading ? "Cargando partners..." : "Selecciona un partner"} />
                            </SelectTrigger>
                            <SelectContent>
                              {partners?.map((partner) => (
                                <SelectItem key={partner.id} value={partner.id}>
                                  {partner.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Monto</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={newPaymentData.amount}
                            onChange={(e) => setNewPaymentData({ ...newPaymentData, amount: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Descripción (Opcional)</Label>
                          <Textarea
                            id="description"
                            placeholder="Ej: Pago de comisiones de Junio"
                            value={newPaymentData.description}
                            onChange={(e) => setNewPaymentData({ ...newPaymentData, description: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Crear Pago
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-8">
             <KpiCard
                title="Total Pagado"
                value={isLoading ? <Loader2 className="animate-spin" /> : `$${totalPaid.toLocaleString()}`}
                Icon={DollarSign}
            />
            <KpiCard
                title="Pagos Pendientes"
                value={isLoading ? <Loader2 className="animate-spin" /> : `$${totalPending.toLocaleString()}`}
                Icon={Clock}
            />
            <KpiCard
              title="Próximo Ciclo de Pago"
              value="Según configuración"
              Icon={CreditCard}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
               {isLoading ? (
                 <div className="flex items-center justify-center h-48">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
               ) : (
                <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Transacción</TableHead>
                      {role === 'superadmin' && <TableHead>Partner</TableHead>}
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      {role === 'superadmin' && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono">{payment.id}</TableCell>
                        {role === 'superadmin' && <TableCell className="font-medium">{payment.partnerName}</TableCell>}
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={payment.status} />
                        </TableCell>
                         {role === 'superadmin' && (
                            <TableCell className="text-right">
                                {payment.status === 'Pendiente' ? (
                                    <Button size="sm" onClick={() => openPayDialog(payment)}>
                                        Marcar como Pagado
                                    </Button>
                                ) : (
                                   <div className="flex items-center justify-end text-green-600 gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Realizado</span>
                                   </div>
                                )}
                            </TableCell>
                         )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                 {payments?.length === 0 && (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg bg-secondary mt-4">
                    <p className="text-muted-foreground">No hay historial de pagos disponible.</p>
                  </div>
                )}
                </>
              )}
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
    
    <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Pago Manual</AlertDialogTitle>
                <AlertDialogDescription>
                    ¿Estás seguro de que quieres marcar este pago de 
                    <span className="font-bold"> ${paymentToPay?.amount.toLocaleString()}</span> para 
                    <span className="font-bold"> {paymentToPay?.partnerName}</span> como "Pagado"?
                    <br />
                    Esta acción es solo un registro y no transfiere dinero real.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmPayment}>
                    Sí, marcar como Pagado
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
