'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Download, Clock, CreditCard } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { payments as allPayments } from "@/lib/data";

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

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userDocRef);

  const { role, uid } = userData || {};

  const payments = role === 'superadmin' 
    ? allPayments 
    : allPayments.filter(p => p.partnerId === uid);

  const totalPaid = payments.filter(p => p.status === 'Pagado').reduce((acc, p) => acc + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'Pendiente').reduce((acc, p) => acc + p.amount, 0);

  if (isRoleLoading) {
    return <div>Cargando datos de pago...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pagos y Facturación</CardTitle>
              <CardDescription>
                Configura ciclos de pago y visualiza el historial de pagos.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Reporte
              </Button>
              <Button>
                 <CreditCard className="mr-2 h-4 w-4" />
                Iniciar Nuevo Pago
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <KpiCard
              title="Total Pagado"
              value={`$${totalPaid.toLocaleString()}`}
              Icon={DollarSign}
            />
            <KpiCard
              title="Pagos Pendientes"
              value={`$${totalPending.toLocaleString()}`}
              Icon={Clock}
            />
            <KpiCard
              title="Próximo Ciclo de Pago"
              value="Julio 25, 2024"
              Icon={CreditCard}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transacción</TableHead>
                    {role === 'superadmin' && <TableHead>Partner</TableHead>}
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono">{payment.id}</TableCell>
                      {role === 'superadmin' && <TableCell className="font-medium">{payment.partnerName}</TableCell>}
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-semibold">${payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
               {payments.length === 0 && (
                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg bg-secondary mt-4">
                  <p className="text-muted-foreground">No hay historial de pagos disponible.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
}
