'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { GitFork, Users, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * @fileOverview Vista de Jerarquía Comercial.
 * Visualiza la estructura multinivel de partners usando el campo parentId.
 * Se ha corregido eliminando interfaces de TypeScript para compatibilidad con archivos .jsx.
 */

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
          <p className="text-[10px] text-muted-foreground truncate">{partner.email} • {partner.pais}</p>
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

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  const partnersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'partners');
  }, [firestore]);

  const { data: partners, isLoading, error } = useCollection(partnersRef);

  const hierarchy = React.useMemo(() => {
    if (!partners || partners.length === 0) return [];
    
    const partnerMap = {};
    partners.forEach(p => {
      partnerMap[p.id] = { ...p, children: [] };
    });

    const roots = [];
    partners.forEach(p => {
      if (p.parentId && partnerMap[p.parentId]) {
        partnerMap[p.parentId].children.push(partnerMap[p.id]);
      } else {
        roots.push(partnerMap[p.id]);
      }
    });

    return roots;
  }, [partners]);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
              <GitFork className="h-8 w-8" /> Jerarquía
            </h1>
            <p className="text-muted-foreground text-sm">
              Estructura multinivel de la red PartnerVerse.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al cargar jerarquía</AlertTitle>
            <AlertDescription>
              No se pudo sincronizar la red de partners. Por favor, intente de nuevo más tarde.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Red de Afiliación</CardTitle>
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
                <h3 className="font-bold text-lg">Sin Red Detectada</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  No se han encontrado relaciones jerárquicas configuradas en el sistema.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
