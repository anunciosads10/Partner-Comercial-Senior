'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '../../../components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '../../../firebase';
import { collection, doc } from 'firebase/firestore';
import { GitFork, Users, Loader2, AlertCircle, Search, Filter, Globe, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';

function PartnerNode({ partner, depth = 0 }) {
  if (!partner) return null;

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-all border-primary/5"
        style={{ marginLeft: `${depth * 24}px` }}
      >
        <div className="bg-primary/10 p-2 rounded-full">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{partner.name}</span>
            <Badge variant="outline" className="text-[9px] h-4 uppercase border-primary/20 text-primary">
              {partner.tier || 'Silver'}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {partner.email} • {partner.pais || 'Territorio Global'}
          </p>
        </div>
        {partner.children && partner.children.length > 0 && (
          <Badge variant="secondary" className="text-[10px] bg-accent/10 text-accent border-none hidden sm:inline-flex">
            {partner.children.length} Referidos
          </Badge>
        )}
      </div>
      {partner.children && partner.children.map((child) => (
        <PartnerNode key={child.id} partner={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function HierarchyPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [tierFilter, setTierFilter] = React.useState('all');
  const [countryFilter, setCountryFilter] = React.useState('all');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  const isSuperAdmin = userData?.role === 'superadmin';

  const partnersRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isSuperAdmin) return null;
    return collection(firestore, 'partners');
  }, [firestore, user?.uid, isSuperAdmin]);

  const { data: partners, isLoading: isPartnersLoading, error } = useCollection(partnersRef);

  React.useEffect(() => {
    if (!isUserLoading && userData && !isSuperAdmin) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isUserLoading, userData, isSuperAdmin, router]);

  const countries = React.useMemo(() => {
    if (!partners) return [];
    return Array.from(new Set(partners.map(p => p.pais).filter(Boolean))).sort();
  }, [partners]);

  const hierarchy = React.useMemo(() => {
    if (!partners || partners.length === 0) return [];
    
    const filteredList = partners.filter(p => {
      const matchesSearch = !searchQuery || 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTier = tierFilter === 'all' || p.tier === tierFilter;
      const matchesCountry = countryFilter === 'all' || p.pais === countryFilter;
      
      return matchesSearch && matchesTier && matchesCountry;
    });

    const partnerMap = {};
    filteredList.forEach(p => {
      partnerMap[p.id] = { ...p, children: [] };
    });

    const roots = [];
    filteredList.forEach(p => {
      if (p.parentId && partnerMap[p.parentId]) {
        partnerMap[p.parentId].children.push(partnerMap[p.id]);
      } else {
        roots.push(partnerMap[p.id]);
      }
    });

    return roots;
  }, [partners, searchQuery, tierFilter, countryFilter]);

  const isLoading = isUserLoading || (isSuperAdmin && isPartnersLoading);

  if (isLoading) {
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
        <div className="flex items-center justify-center min-h-[55vh]">
          <Card className="max-w-md w-full border-primary/20 shadow-lg text-center p-6">
            <CardHeader className="flex flex-col items-center gap-3 pb-2">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl font-black uppercase text-slate-800">
                Acceso Restringido
              </CardTitle>
              <CardDescription className="text-xs">
                La vista de red jerárquica multinivel está reservada exclusivamente para Super Administradores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="text-[11px] text-muted-foreground">
                Serás redirigido al Panel Principal en unos momentos...
              </p>
              <Button 
                onClick={() => router.push('/dashboard')} 
                className="font-bold w-full"
              >
                Volver al Panel Principal
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
              <GitFork className="h-8 w-8" /> Jerarquía
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Estructura multinivel de la red PartnerVerse.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-primary/10 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar socio por nombre o email..." 
              className="pl-10 shadow-sm border-primary/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full md:w-[160px] shadow-sm">
                <Filter className="w-3 h-3 mr-2 opacity-50" />
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Niveles</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full md:w-[160px] shadow-sm">
                <Globe className="w-3 h-3 mr-2 opacity-50" />
                <SelectValue placeholder="Territorio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Territorios</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de Acceso</AlertTitle>
            <AlertDescription>
              No tienes permisos para ver la red global o hubo un problema de conexión.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg uppercase font-black text-primary tracking-tight">Red de Afiliación</CardTitle>
            <CardDescription>
              Visualiza las relaciones jerárquicas y el crecimiento de tu red.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {hierarchy.length > 0 ? (
              <div className="space-y-4">
                {hierarchy.map(root => (
                  <PartnerNode key={root.id} partner={root} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                <div className="bg-muted/50 p-6 rounded-full mb-4">
                  <GitFork className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <h3 className="font-bold text-lg">Sin Resultados</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  No se han encontrado relaciones jerárquicas que coincidan con los criterios de búsqueda.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
