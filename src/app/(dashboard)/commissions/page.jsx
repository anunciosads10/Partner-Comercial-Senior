'use client';
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Input } from '@/components/ui/input';
import { Search, Download, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from "@/hooks/use-toast";


const CommissionsTable = ({ commissions }) => {
  if (!commissions || commissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
        <p className="text-muted-foreground">No hay datos de comisiones disponibles.</p>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID Transacción</TableHead>
          <TableHead>Partner</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead><span className="sr-only">Acciones</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {commissions.map((commission) => (
          <TableRow key={commission.id}>
            <TableCell className="font-mono">{commission.id}</TableCell>
            <TableCell>{commission.partnerName || 'N/A'}</TableCell>
            <TableCell className="font-semibold text-primary">${commission.amount.toLocaleString()}</TableCell>
            <TableCell>{new Date(commission.paymentDate).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge variant={commission.status === 'Pagado' ? 'default' : 'secondary'}>{commission.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Ver Detalle</DropdownMenuItem>
                        <DropdownMenuItem>Notificar Partner</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};


export default function CommissionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userDocRef);

  const { role, uid } = userData || {};

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (role === 'superadmin') {
      return collection(firestore, 'payments');
    }
    if (role === 'admin' && uid) {
      return query(collection(firestore, 'payments'), where('partnerId', '==', uid));
    }
    return null;
  }, [firestore, role, uid]);

  const { data: allCommissions, isLoading: areCommissionsLoading } = useCollection(paymentsQuery);
    
  const filteredCommissions = React.useMemo(() => {
    if (!allCommissions) return [];
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allCommissions.filter(commission =>
      commission.id.toLowerCase().includes(lowerCaseSearch) ||
      (commission.partnerName || '').toLowerCase().includes(lowerCaseSearch) ||
      commission.status.toLowerCase().includes(lowerCaseSearch)
    );
  }, [allCommissions, searchTerm]);


  const totalEarnings = filteredCommissions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  
  const isLoading = isRoleLoading || areCommissionsLoading;

  const handleExport = () => {
    if (!filteredCommissions || filteredCommissions.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay datos para exportar",
      });
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["ID Transaccion", "Partner", "Monto", "Fecha", "Estado"];
    csvContent += headers.join(",") + "\r\n";

    filteredCommissions.forEach(c => {
      const row = [
        c.id,
        c.partnerName || 'N/A',
        c.amount,
        new Date(c.paymentDate).toLocaleDateString(),
        c.status
      ];
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_comisiones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

     toast({ title: "Reporte de Comisiones Generado" });
  };


  if (isLoading) {
    return <div>Cargando comisiones...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle>Tus Comisiones</CardTitle>
                <CardDescription>
                  {role === 'superadmin' 
                    ? "Un resumen operativo de todas las transacciones de comisiones." 
                    : "Aquí tienes un desglose detallado de tus ganancias."}
                </CardDescription>
            </div>
            {role === 'superadmin' && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Reporte
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
           <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, partner o estado..."
                className="w-full rounded-lg bg-secondary pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          <CommissionsTable commissions={filteredCommissions} />
        </CardContent>
      </Card>
      <Card className="w-full md:w-1/3 self-end">
          <CardHeader className="pb-2">
              <CardDescription>Ganancias Totales (Filtradas)</CardDescription>
              <CardTitle className="text-4xl">${totalEarnings.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="text-xs text-muted-foreground">
                  Esta es la suma de las comisiones que coinciden con tu búsqueda.
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
