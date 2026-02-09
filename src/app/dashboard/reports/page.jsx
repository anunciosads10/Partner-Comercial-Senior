'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '../../../components/authenticated-layout';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser, 
  useDoc 
} from '../../../firebase';
import { collection, doc, query, orderBy, limit } from 'firebase/firestore';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Download, 
  Loader2, 
  ShieldAlert,
  Calendar,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { SalesChart } from '../../../components/dashboard/sales-chart';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../components/ui/select';

/**
 * @fileOverview Centro de Inteligencia y Reportes Globales.
 * Proporciona visibilidad total sobre la salud financiera y operativa del ecosistema de partners.
 */

export default function ReportsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [period, setPeriod] = React.useState('current_month');

  // Verificación estricta de rol SuperAdmin
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  // Consulta de pagos globales para analítica
  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'payments'), orderBy('paymentDate', 'desc'), limit(100));
  }, [firestore, user?.uid]);

  const { data: payments, isLoading: isPaymentsLoading } = useCollection(paymentsQuery);

  // Consulta de partners para métricas de red
  const partnersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'partners');
  }, [firestore, user?.uid]);

  const { data: partners, isLoading: isPartnersLoading } = useCollection(partnersQuery);

  // Cálculos de métricas (Simulando agregaciones que normalmente vendrían de un Cloud Function o Backend de analítica)
  const stats = React.useMemo(() => {
    if (!payments || !partners) return { totalRevenue: 0, totalPaid: 0, activePartners: 0 };
    
    const totalRevenue = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) * 5.4; // Simulación de Gross Revenue
    const totalPaid = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const activePartners = partners.filter(p => p.status === 'Active').length;

    return { totalRevenue, totalPaid, activePartners };
  }, [payments, partners]);

  const chartData = React.useMemo(() => [
    { month: 'Ene', total: 42000 },
    { month: 'Feb', total: 58000 },
    { month: 'Mar', total: 51000 },
    { month: 'Abr', total: 72000 },
    { month: 'May', total: 69000 },
    { month: 'Jun', total: 85000 },
  ], []);

  if (isUserLoading || isPaymentsLoading || isPartnersLoading) {
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
          <p className="text-muted-foreground max-w-md">Esta sección contiene datos financieros consolidados y solo es accesible para la Alta Gerencia.</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
              <BarChart3 className="h-8 w-8" /> Reportes Globales
            </h1>
            <p className="text-muted-foreground text-sm">Visión integral del rendimiento del ecosistema PartnerVerse.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] bg-white">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Mes Actual</SelectItem>
                <SelectItem value="last_quarter">Último Trimestre</SelectItem>
                <SelectItem value="year_to_date">Este Año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 shrink-0">
              <Download className="h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Brutos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-accent flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +14.2% vs mes anterior
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comisiones Liquidadas</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Representa el 18.5% del margen
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Partners Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePartners}</div>
              <p className="text-xs text-accent flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +4 socios nuevos
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate (Riesgo)</CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4%</div>
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <TrendingDown className="h-3 w-3" /> -0.8% bajo control
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-6">
          <div className="lg:col-span-4">
            <SalesChart data={chartData} />
          </div>
          <div className="lg:col-span-2">
            <Card className="h-full border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Distribución por Tier</CardTitle>
                <CardDescription>Composición de la red de socios.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Platinum</span>
                    <span className="text-primary font-bold">15%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[15%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Gold</span>
                    <span className="text-accent font-bold">35%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[35%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Silver</span>
                    <span className="text-muted-foreground font-bold">50%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground w-[50%]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Auditoría de Pagos Recientes</CardTitle>
            <CardDescription>Registro histórico de transacciones financieras procesadas.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Referencia Pago</TableHead>
                  <TableHead>Partner ID</TableHead>
                  <TableHead className="text-right">Monto Liquidado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments && payments.length > 0 ? (
                  payments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{p.id}</TableCell>
                      <TableCell className="text-xs font-semibold">{p.partnerId}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-primary">${p.amount?.toLocaleString()}</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                      No se han encontrado registros financieros en el periodo seleccionado.
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
