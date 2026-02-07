'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { GitFork, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

function getTierBadgeVariant(tier) {
  switch (tier) {
    case 'Platinum':
      return 'default';
    case 'Gold':
      return 'secondary';
    case 'Silver':
    default:
      return 'outline';
  }
}

// Componente recursivo para renderizar cada nodo del árbol
const PartnerNode = ({ partner }) => {
  if (!partner) return null;

  return (
    <div className="ml-6 pl-6 border-l-2 border-border">
      <Card className="mb-4">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar>
            <AvatarImage src={partner.avatarUrl} alt={partner.name} />
            <AvatarFallback>{partner.name?.slice(0, 2) || 'P'}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <h4 className="font-semibold">{partner.name}</h4>
            <p className="text-sm text-muted-foreground">{partner.email}</p>
          </div>
          <Badge variant={getTierBadgeVariant(partner.tier)}>{partner.tier}</Badge>
        </CardContent>
      </Card>
      {partner.children && partner.children.length > 0 && (
        <div>
          {partner.children.map(child => (
            <PartnerNode key={child.id} partner={child} />
          ))}
        </div>
      )}
    </div>
  );
};


export default function HierarchyPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const partnersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'partners');
  }, [firestore]);

  const { data: partners, isLoading } = useCollection(partnersCollection);

  const hierarchy = React.useMemo(() => {
    if (!partners) return [];

    const partnersMap = new Map(partners.map(p => [p.id, { ...p, children: [] }]));
    const rootPartners = [];

    partnersMap.forEach(partner => {
      if (partner.parentId && partnersMap.has(partner.parentId)) {
        partnersMap.get(partner.parentId).children.push(partner);
      } else {
        rootPartners.push(partner);
      }
    });
    
    // Ordenar para consistencia
    rootPartners.sort((a,b) => a.name.localeCompare(b.name));
    partnersMap.forEach(p => p.children.sort((a,b) => a.name.localeCompare(b.name)));

    return rootPartners;
  }, [partners]);

  const filteredHierarchy = React.useMemo(() => {
    if (!searchTerm) {
      return hierarchy;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();

    function filterTree(nodes) {
      const result = [];
      for (const node of nodes) {
        const children = node.children ? filterTree(node.children) : [];
        
        const selfMatches = node.name.toLowerCase().includes(lowerCaseSearch) || 
                            node.email.toLowerCase().includes(lowerCaseSearch);

        if (selfMatches || children.length > 0) {
          result.push({ ...node, children });
        }
      }
      return result;
    }

    return filterTree(hierarchy);
  }, [hierarchy, searchTerm]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Jerarquía de Partners</CardTitle>
        <CardDescription>
          Visualiza la estructura de partners y sus relaciones de sub-partners.
        </CardDescription>
         <div className="mt-4 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o email..."
            className="w-full rounded-lg bg-secondary pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Cargando jerarquía...</p>}
        {!isLoading && filteredHierarchy.length === 0 && (
          <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg bg-secondary">
            <div className="text-center">
              <GitFork className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm ? 'No se encontraron partners que coincidan con la búsqueda.' : 'No hay datos de jerarquía para mostrar.'}
              </p>
              <p className="text-xs text-muted-foreground">Añade partners con el campo 'parentId' para construir el árbol.</p>
            </div>
          </div>
        )}
        {!isLoading && filteredHierarchy.length > 0 && (
          <div className="space-y-4">
            {filteredHierarchy.map(rootPartner => (
              <PartnerNode key={rootPartner.id} partner={rootPartner} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
