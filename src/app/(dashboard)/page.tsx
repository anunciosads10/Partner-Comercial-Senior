import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { PartnerRankings } from "@/components/dashboard/partner-rankings";
import { AtRiskPartners } from "@/components/dashboard/at-risk-partners";
import { partners } from "@/lib/data";

export default function DashboardPage() {
  const totalRevenue = partners.reduce((acc, partner) => acc + partner.revenue, 0);
  const totalSales = partners.reduce((acc, partner) => acc + partner.totalSales, 0);
  const activePartners = partners.filter(p => p.status === 'Active').length;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={`$${(totalRevenue / 1000).toFixed(1)}k`}
          change="+20.1% from last month"
          Icon={DollarSign}
        />
        <KpiCard
          title="Total Sales"
          value={`$${(totalSales / 1000).toFixed(1)}k`}
          change="+180.1% from last month"
          Icon={CreditCard}
        />
        <KpiCard
          title="Active Partners"
          value={`+${activePartners}`}
          change="+19% from last month"
          Icon={Users}
        />
        <KpiCard
          title="Commissions Paid"
          value="$12,234"
          change="+5% from last month"
          Icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <SalesChart />
        <PartnerRankings />
      </div>

      <AtRiskPartners />
    </div>
  );
}
