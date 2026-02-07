'use client';

import * as React from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { PartnerRankings } from '@/components/dashboard/partner-rankings';
import { AtRiskPartners } from '@/components/dashboard/at-risk-partners';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { DollarSign, Users, BarChart3, TrendingUp, Loader2 } from 'lucide-react';

/**
 * @fileOverview Panel Principal del PartnerVerse.
 */
export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Memoria de queries para evitar re-renders infinitos
  const partnersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'partners');
  }, [firestore]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'payments');
  }, [firestore]);

  const { data: partners, isLoading: loadingPartners } = useCollection(partnersQuery);
  const { data: payments, isLoading: loadingPayments } = useCollection(paymentsQuery);

  // Cálculos de KPIs basados en datos reales de Firestore
  const stats = React.useMemo(() => {
    if (!partners || !payments) return { totalRevenue: 0, activePartners: 0, totalSales: 0 };
    
    return {
      totalRevenue: payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
      activePartners: partners.filter(p => p.status === 'Active').length,
      totalSales: partners.reduce((acc, curr) => acc + (Number(curr.totalSales) || 0), 0)
    };
  }, [partners, payments]);

  if (loadingPartners || loadingPayments) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
        <p className="text-muted-foreground">Bienvenido al centro de operaciones de PartnerVerse.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ingresos Totales"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change="+12% respecto al mes anterior"
          Icon={DollarSign}
        />
        <KpiCard
          title="Partners Activos"
          value={stats.activePartners.toString()}
          change="3 nuevos esta semana"
          Icon={Users}
        />
        <KpiCard
          title="Ventas Totales"
          value={`$${stats.totalSales.toLocaleString()}`}
          change="+5.4% de crecimiento"
          Icon={BarChart3}
        />
        <KpiCard
          title="Tasa de Conversión"
          value="18.5%"
          change="+2.1% de mejora"
          Icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
        <SalesChart data={[]} />
        <PartnerRankings partners={partners} />
      </div>

      <div className="grid gap-4 grid-cols-1">
        <AtRiskPartners partners={partners} />
      </div>
    </div>
  );
}
