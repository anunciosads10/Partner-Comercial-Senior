'use client';
import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  Award,
  TrendingUp,
  Target
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { PartnerRankings } from "@/components/dashboard/partner-rankings";
import { AtRiskPartners } from "@/components/dashboard/at-risk-partners";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SuperAdminDashboard = ({ partners, isLoading }) => {
  if (isLoading) {
    return <div>Loading Dashboard...</div>;
  }

  const totalRevenue = partners?.reduce((acc, partner) => acc + (partner.revenue || 0), 0) || 0;
  const totalSales = partners?.reduce((acc, partner) => acc + (partner.totalSales || 0), 0) || 0;
  const activePartners = partners?.filter(p => p.status === 'Active').length || 0;

  return (
    <>
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
        <PartnerRankings partners={partners} />
      </div>

      <AtRiskPartners partners={partners} />
    </>
  );
};

const AdminDashboard = ({ partnerData, isLoading, user, firestore }) => {
  if (isLoading) {
    return <div>Loading Partner Dashboard...</div>;
  }

  const handleCreateProfile = async () => {
    if (!user || !firestore) return;
    const partnerRef = doc(firestore, 'partners', user.uid);
    const newPartnerData = {
      id: user.uid,
      name: user.email?.split('@')[0] || 'New Partner',
      email: user.email,
      tier: 'Silver',
      status: 'Active',
      territory: 'Unassigned',
      joinDate: new Date().toISOString(),
      totalSales: 0,
      revenue: 0,
      avatarUrl: '',
    };
    await setDoc(partnerRef, newPartnerData);
    // The useDoc hook will automatically refresh the data
  };


  if (!partnerData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Partner Profile Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your user is authenticated, but we couldn't find a corresponding partner profile in our database.</p>
          <p className="mt-2 text-muted-foreground">Click the button below to create a sample profile and get started.</p>
        </CardContent>
        <CardFooter>
            <Button onClick={handleCreateProfile}>Create My Partner Profile</Button>
        </CardFooter>
      </Card>
    );
  }

  const { name, tier, totalSales, revenue } = partnerData;

  const getTierBadgeVariant = (tier) => {
    switch (tier) {
      case 'Platinum':
        return 'default';
      case 'Gold':
        return 'secondary';
      case 'Silver':
      default:
        return 'outline';
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partner Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Your Tier:</span>
          <Badge variant={getTierBadgeVariant(tier)} className="text-lg px-4 py-1">{tier}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Your Total Sales"
          value={`$${(totalSales / 1000).toFixed(1)}k`}
          change="+12% this quarter"
          Icon={TrendingUp}
        />
        <KpiCard
          title="Your Revenue Share"
          value={`$${(revenue / 1000).toFixed(1)}k`}
          change="+8% this quarter"
          Icon={DollarSign}
        />
        <KpiCard
          title="Your Commissions"
          value="$8,450"
          change="Next payout in 15 days"
          Icon={Award}
        />
      </div>
       <div className="grid grid-cols-1 gap-4 mt-8">
        <SalesChart />
      </div>
    </>
  );
}


export default function DashboardPage() {
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userDocRef);
  const { role } = userData || {};

  // Data fetching for SuperAdmin
  const partnersCollection = useMemoFirebase(() => {
    if (!firestore || role !== 'superadmin') return null;
    return collection(firestore, 'partners');
  }, [firestore, role]);
  const { data: partners, isLoading: isLoadingPartners } = useCollection(partnersCollection);
  
  // Data fetching for Admin (Partner)
  const partnerDocRef = useMemoFirebase(() => {
    if (!firestore || role !== 'admin' || !user) return null;
    return doc(firestore, 'partners', user.uid);
  }, [firestore, role, user]);
  const { data: partnerData, isLoading: isLoadingPartnerData } = useDoc(partnerDocRef);

  const isLoading = isAuthLoading || isRoleLoading;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {role === 'superadmin' && <SuperAdminDashboard partners={partners} isLoading={isLoadingPartners} />}
      {role === 'admin' && <AdminDashboard partnerData={partnerData} isLoading={isLoadingPartnerData} user={user} firestore={firestore} />}
    </div>
  );
}
