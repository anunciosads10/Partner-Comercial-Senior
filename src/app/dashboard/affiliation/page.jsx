'use client';

import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Network, Search, Filter, Loader2, Copy, Check, ExternalLink, ShieldCheck, Power } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function AffiliationAdminPage() {
  const searchParams = useSearchParams();
  const partnerUrlParam = searchParams?.get('partner') || '';

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = React.useState(partnerUrlParam || '');
  const [platformFilter, setPlatformFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [copiedId, setCopiedId] = React.useState(null);

  // Verificación de SuperAdmin
  const userDocRef = useMemoFirebase(() => (!firestore || !user?.uid ? null : doc(firestore, 'users', user.uid)), [firestore, user?.uid]);
  const { data: userData, isLoading: isRoleLoading } = useDoc(userDocRef);
  const isSuperAdmin = userData?.role === 'superadmin';

  // Catálogo de plataformas SaaS
  const platformsRef = useMemoFirebase(() => (!firestore ? null : collection(firestore, 'saasPlatforms')), [firestore]);
  const { data: platforms } = useCollection(platformsRef);

  // Lista de socios / partners
  const partnersRef = useMemoFirebase(() => (!firestore ? null : collection(firestore, 'partners')), [firestore]);
  const { data: partners, isLoading: isPartnersLoading } = useCollection(partnersRef);

  // Construir matriz consolidada de códigos de afiliado (Partners x Plataformas)
  const affiliateRecords = React.useMemo(() => {
    if (!partners || !platforms) return [];
    const list = [];

    partners.forEach(partner => {
      const code = partner.referralCode || partner.id?.substring(0, 8).toUpperCase() || 'PARTNER';
      const status = partner.status || 'Active';
      const isInactive = status === 'Inactive' || status === 'Suspended';
      const pClicks = partner.clicks || 0;
      const pSignups = partner.signupsFromLink || 0;

      platforms.forEach(platform => {
        // Verificar si el partner tiene activa esta plataforma (si existe la prop afiliaciones)
        const affiliatedList = partner.affiliatedPlatforms;
        const isAffiliated = !affiliatedList || (Array.isArray(affiliatedList) && affiliatedList.includes(platform.id));
        
        if (isAffiliated) {
          const cleanDomain = platform.domain ? platform.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') : (platform.slug ? `${platform.slug}.app` : 'menfy.app');
          const url = `https://${cleanDomain}/aff/${code}`;

          // Metricas específicas o repartidas
          const clicks = partner.platformMetrics?.[platform.id]?.clicks ?? (platforms.length === 1 ? pClicks : Math.floor(pClicks / platforms.length));
          const signups = partner.platformMetrics?.[platform.id]?.signups ?? (platforms.length === 1 ? pSignups : Math.floor(pSignups / platforms.length));
          const conversion = clicks > 0 ? ((signups / clicks) * 100).toFixed(1) : '0.0';

          list.push({
            id: `${partner.id}-${platform.id}`,
            partnerId: partner.id,
            partnerName: partner.name || partner.email || 'Socio',
            platformId: platform.id,
            platformName: platform.name || 'SaaS',
            code,
            url,
            clicks,
            signups,
            conversion,
            status: isInactive ? 'Inactive' : 'Active',
            createdAt: partner.joinDate || new Date().toISOString(),
          });
        }
      });
    });

    return list;
  }, [partners, platforms]);

  // Filtrado reactivo
  const filteredRecords = React.useMemo(() => {
    return affiliateRecords.filter(item => {
      const matchSearch = !searchQuery || item.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlatform = platformFilter === 'all' || item.platformId === platformFilter;
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchSearch && matchPlatform && matchStatus;
    });
  }, [affiliateRecords, searchQuery, platformFilter, statusFilter]);

  // Métricas de resumen globales / filtradas
  const summary = React.useMemo(() => {
    const totalActive = filteredRecords.filter(i => i.status === 'Active').length;
    const totalClicks = filteredRecords.reduce((acc, i) => acc + i.clicks, 0);
    const totalSignups = filteredRecords.reduce((acc, i) => acc + i.signups, 0);
    const avgConversion = totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) : '0.0';
    return { totalActive, totalClicks, totalSignups, avgConversion };
  }, [filteredRecords]);

  // Toggle Activar / Desactivar socio en Firestore
  const handleToggleStatus = async (partnerId, currentStatus) => {
    if (!firestore) return;
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await updateDoc(doc(firestore, 'partners', partnerId), { status: newStatus });
      toast({ title: "Estado Actualizado", description: `El código de afiliado ahora está ${newStatus === 'Active' ? 'ACTIVO' : 'INACTIVO'}.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado." });
    }
  };

  const handleCopy = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({ title: "URL Copiada", description: "Enlace de afiliado copiado al portapapeles." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isRoleLoading || isPartnersLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
          <h2 className="text-2xl font-bold">Acceso Denegado</h2>
          <p className="text-muted-foreground">Sección exclusiva para Super Administradores.</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
              <Network className="h-8 w-8 text-purple-600" /> Afiliación SaaS
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Control centralizado de códigos de afiliado y rendimiento en todas las plataformas SaaS.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1 font-bold text-xs py-1 px-3">
            <ShieldCheck className="h-4 w-4 text-purple-600" /> SuperAdmin Control
          </Badge>
        </div>

        {/* Cards de Resumen */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-primary/10 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Códigos Activos</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-primary">{summary.totalActive}</div></CardContent></Card>
          <Card className="border-primary/10 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Total Clics</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-blue-600">{summary.totalClicks}</div></CardContent></Card>
          <Card className="border-primary/10 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Total Registros</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-emerald-600">{summary.totalSignups}</div></CardContent></Card>
          <Card className="border-primary/10 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-muted-foreground">Conversión Global</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-purple-600">{summary.avgConversion}%</div></CardContent></Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-primary/10 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por socio o código..." className="pl-10 shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full md:w-[200px] shadow-sm"><SelectValue placeholder="Plataforma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Plataformas</SelectItem>
              {platforms?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[160px] shadow-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Estados</SelectItem>
              <SelectItem value="Active">Activos</SelectItem>
              <SelectItem value="Inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla Consolidada */}
        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4"><CardTitle className="text-lg font-black uppercase">Listado Consolidado de Afiliados ({filteredRecords.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead>Partner</TableHead><TableHead>Plataforma</TableHead><TableHead>Código</TableHead><TableHead>URL de Seguimiento</TableHead><TableHead className="text-center">Clics</TableHead><TableHead className="text-center">Registros</TableHead><TableHead className="text-center">Conv. %</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? filteredRecords.map(item => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-sm">{item.partnerName}</TableCell>
                    <TableCell><Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px]">{item.platformName}</Badge></TableCell>
                    <TableCell><span className="font-mono font-bold text-xs bg-muted px-2 py-1 rounded">{item.code}</span></TableCell>
                    <TableCell><span className="font-mono text-xs text-muted-foreground truncate max-w-[180px] block">{item.url}</span></TableCell>
                    <TableCell className="text-center font-bold">{item.clicks}</TableCell>
                    <TableCell className="text-center font-bold text-emerald-600">{item.signups}</TableCell>
                    <TableCell className="text-center font-black text-purple-600">{item.conversion}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`uppercase text-[10px] font-bold ${item.status === 'Active' ? 'text-emerald-600 border-emerald-300 bg-emerald-50' : 'text-rose-600 border-rose-300 bg-rose-50'}`}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch checked={item.status === 'Active'} onCheckedChange={() => handleToggleStatus(item.partnerId, item.status)} />
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-primary hover:bg-primary/10" onClick={() => handleCopy(item.id, item.url)}>
                          {copiedId === item.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={9} className="text-center py-16 italic text-muted-foreground">No se encontraron registros de afiliación.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
