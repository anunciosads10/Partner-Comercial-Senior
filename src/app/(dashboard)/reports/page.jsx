'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, CheckCircle, Clock, Download, BarChart3, Users, Puzzle, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { addDays, format, subYears } from "date-fns";
import { DateRangePicker } from '@/components/ui/date-range-picker';

const ReportsPage = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // Obtener todas las comisiones y partners para los reportes
    const commissionsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'commissions') : null, [firestore]);
    const partnersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'partners') : null, [firestore]);
    
    const { data: commissions, isLoading: isLoadingCommissions } = useCollection(commissionsCollection);
    const { data: partners, isLoading: isLoadingPartners } = useCollection(partnersCollection);
    
    // Estados para los filtros
    const [date, setDate] = React.useState({ from: subYears(new Date(), 1), to: new Date() });
    const [selectedPartner, setSelectedPartner] = React.useState('all');
    const [selectedStatus, setSelectedStatus] = React.useState('all');

    // Mapeo de nombres de partners para acceso rápido
    const partnerNames = React.useMemo(() => {
        if (!partners) return {};
        return partners.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});
    }, [partners]);

    // Filtrar comisiones según los filtros seleccionados
    const filteredCommissions = React.useMemo(() => {
        if (!commissions) return [];
        return commissions.filter(c => {
            const commissionDate = new Date(c.date || c.createdAt || Date.now());
            const isAfterFrom = !date?.from || commissionDate >= date.from;
            const isBeforeTo = !date?.to || commissionDate <= date.to;
            const partnerMatch = selectedPartner === 'all' || c.partnerId === selectedPartner;
            const statusMatch = selectedStatus === 'all' || c.status === selectedStatus;
            return isAfterFrom && isBeforeTo && partnerMatch && statusMatch;
        });
    }, [commissions, date, selectedPartner, selectedStatus]);

    // Calcular KPIs
    const totalCommissions = filteredCommissions.reduce((acc, c) => acc + c.earning, 0);
    const paidCommissions = filteredCommissions.filter(c => c.status === 'Paid').reduce((acc, c) => acc + c.earning, 0);
    const pendingCommissions = filteredCommissions.filter(c => c.status === 'Pending').reduce((acc, c) => acc + c.earning, 0);

    const isLoading = isLoadingCommissions || isLoadingPartners;

    const handleExport = () => {
        if (!filteredCommissions || filteredCommissions.length === 0) {
          toast({ variant: "destructive", title: "No hay datos para exportar." });
          return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = ["ID Venta", "Partner", "Fecha", "Producto", "Monto Venta", "Tasa Comision (%)", "Ganancia", "Estado"];
        csvContent += headers.join(",") + "\r\n";

        filteredCommissions.forEach(c => {
          const commissionDate = c.date || c.createdAt;
          const row = [
            c.id,
            partnerNames[c.partnerId] || c.partnerId,
            commissionDate ? new Date(commissionDate).toLocaleDateString() : 'N/A',
            c.product || 'N/A',
            c.saleAmount || 0,
            c.commissionRate || 0,
            c.earning || 0,
            c.status || 'N/A'
          ];
          csvContent += row.join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_comisiones_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: "Reporte Generado", description: "La descarga de tu reporte ha comenzado." });
    };

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-6 w-6" />
                                Reportes Financieros
                            </CardTitle>
                            <CardDescription>
                                Analiza el rendimiento de las comisiones y los pagos a tus partners.
                            </CardDescription>
                        </div>
                        <Button onClick={handleExport} disabled={isLoading || !filteredCommissions || filteredCommissions.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar a CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <KpiCard title="Comisiones Totales" value={isLoading ? <Loader2 className="animate-spin" /> : `$${totalCommissions.toLocaleString()}`} Icon={DollarSign} />
                        <KpiCard title="Comisiones Pagadas" value={isLoading ? <Loader2 className="animate-spin" /> : `$${paidCommissions.toLocaleString()}`} Icon={CheckCircle} />
                        <KpiCard title="Comisiones Pendientes" value={isLoading ? <Loader2 className="animate-spin" /> : `$${pendingCommissions.toLocaleString()}`} Icon={Clock} />
                    </div>

                    {/* Filtros */}
                    <Card className="bg-secondary/50">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Partner</Label>
                                    <Select value={selectedPartner} onValueChange={setSelectedPartner} disabled={isLoading}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar partner..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Partners</SelectItem>
                                            {partners?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Estado de Comisión</Label>
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isLoading}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar estado..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Estados</SelectItem>
                                            <SelectItem value="Pending">Pendiente</SelectItem>
                                            <SelectItem value="Paid">Pagado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="grid gap-2">
                                     <Label>Rango de Fechas</Label>
                                     <DateRangePicker date={date} onDateChange={setDate} />
                                 </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabla de Datos */}
                    <Card>
                        <CardHeader>
                          <CardTitle>Detalle de Comisiones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Partner</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Monto Venta</TableHead>
                                            <TableHead>Ganancia</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCommissions.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{partnerNames[c.partnerId] || 'N/A'}</TableCell>
                                                <TableCell>{c.product}</TableCell>
                                                <TableCell>${c.saleAmount.toLocaleString()}</TableCell>
                                                <TableCell className="font-semibold text-primary">${c.earning.toLocaleString()}</TableCell>
                                                <TableCell><Badge variant={c.status === 'Paid' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                             {!isLoading && filteredCommissions.length === 0 && (
                                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No se encontraron comisiones con los filtros seleccionados.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportsPage;
