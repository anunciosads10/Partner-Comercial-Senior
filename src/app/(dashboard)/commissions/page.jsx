'use client';
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { commissions as allCommissions } from "@/lib/data";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
          <TableHead>ID Venta</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Monto Venta</TableHead>
          <TableHead>Tasa Comisión</TableHead>
          <TableHead>Ganancia</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {commissions.map((commission) => (
          <TableRow key={commission.id}>
            <TableCell className="font-medium">{commission.id}</TableCell>
            <TableCell>{commission.product}</TableCell>
            <TableCell>${commission.saleAmount.toLocaleString()}</TableCell>
            <TableCell>{commission.commissionRate}%</TableCell>
            <TableCell className="font-semibold text-green-600">${commission.earning.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={commission.status === 'Paid' ? 'default' : 'secondary'}>{commission.status === 'Paid' ? 'Pagada' : 'Pendiente'}</Badge>
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
  const [searchTerm, setSearchTerm] = React.useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userDocRef);

  const { role, uid } = userData || {};

  // Filtrar comisiones basado en el rol del usuario
  const commissions = role === 'superadmin' 
    ? allCommissions 
    : allCommissions.filter(c => c.partnerId === uid);
    
  const filteredCommissions = React.useMemo(() => {
    if (!commissions) return [];
    return commissions.filter(commission =>
      commission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (commission.status === 'Paid' ? 'pagada' : 'pendiente').includes(searchTerm.toLowerCase())
    );
  }, [commissions, searchTerm]);


  const totalEarnings = filteredCommissions.reduce((acc, curr) => acc + curr.earning, 0);

  if (isRoleLoading) {
    return <div>Cargando comisiones...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Tus Comisiones</CardTitle>
          <CardDescription>
            {role === 'superadmin' 
              ? "Un resumen completo de todas las comisiones de los partners." 
              : "Aquí tienes un desglose detallado de tus ganancias."}
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, producto o estado..."
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
