'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '../../components/authenticated-layout';
import { KpiCard } from '../../components/dashboard/kpi-card';
import { SalesChart } from '../../components/dashboard/sales-chart';
import { PartnerRankings } from '../../components/dashboard/partner-rankings';
import { AtRiskPartners } from '../../components/dashboard/at-risk-partners';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '../../firebase';
import { collection, doc } from 'firebase/firestore';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

/**
 * @fileOverview Panel Principal del Dashboard con rutas relativas para producción.
 */

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  const partnersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'partners');
  }, [firestore, user?.uid]);

  const { data: partners, isLoading: isPartnersLoading } = useCollection(partnersQuery);

  const chartData = React.useMemo(() => [
    { month: 'Ene', total: 4500 },
    { month: 'Feb', total: 5200 },
    { month: 'Mar', total: 4800 },
    { month: 'Abr', total: 6100 },
    { month: 'May', total: 5900 },
    { month: 'Jun', total: 7200 },
  ], []);

  if (!isMounted) return null;

  if (isUserLoading || isPartnersLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const isSuperAdmin = userData?.role === 'superadmin';

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
          <p className="text-muted-foreground">
            Bienvenido de nuevo, {userData?.name || 'Usuario'}.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard 
            title="Partners Activos" 
            value={partners?.length || 0} 
            change="+2 este mes" 
            Icon={Users} 
          />
          <KpiCard 
            title="Comisiones Totales" 
            value="$45,231" 
            change="+12% vs mes anterior" 
            Icon={DollarSign} 
          />
          <KpiCard 
            title="Crecimiento Red" 
            value="18.5%" 
            change="En ascenso" 
            Icon={TrendingUp} 
          />
          <KpiCard 
            title="Alertas de Riesgo" 
            value="3" 
            change="Requieren atención" 
            Icon={AlertTriangle} 
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <SalesChart data={chartData} />
          {isSuperAdmin && partners && <AtRiskPartners partners={partners} />}
        </div>

        <div className="grid gap-6 lg:grid-cols-1">
          <PartnerRankings partners={partners || []} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
