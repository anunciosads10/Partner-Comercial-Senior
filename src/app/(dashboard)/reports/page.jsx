'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, CheckCircle, Clock, Download, BarChart3, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format, subYears, startOfDay, endOfDay, isWithinInterval, parse } from "date-fns";
import { DateRangePicker } from '@/components/ui/date-range-picker';

const ReportsPage = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const commissionsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'commissions') : null, [firestore]);
    const partnersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'partners') : null, [firestore]);
    
    const { data: commissions, isLoading: isLoadingCommissions } = useCollection(commissionsCollection);
    const { data: partners, isLoading: isLoadingPartners } = useCollection(partnersCollection);
    
    const [date, setDate] = React.useState({ from: subYears(new Date(), 1), to: new Date() });
    const [selectedPartner, setSelectedPartner] = React.useState('all');
    const [selectedStatus, setSelectedStatus] = React.useState('all');

    const partnerNames = React.useMemo(() => {
        if (!partners) return {};
        return partners.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});
    }, [partners]);

    // FUNCIÓN CRÍTICA: Parsea fechas asumiendo formato latino (5/1/2026 = 5 de Enero)
    const robustParseDate = (dateValue) => {
        if (!dateValue) return null;
        if (dateValue.toDate) return dateValue.toDate(); // Firebase Timestamp
        if (dateValue instanceof Date) return dateValue;
        
        if (typeof dateValue === 'string') {
            // Si tiene "/" probamos primero formato latino DD/MM/YYYY
            if (dateValue.includes('/')) {
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                    // Forzamos interpretación DD/MM/YYYY
                    const d = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10) - 1;
                    const y = parseInt(parts[2], 10);
                    const parsed = new Date(y, m, d);
                    if (!isNaN(parsed.getTime())) return parsed;
                }
            }
            // Fallback para otros formatos de string como ISO
            const native = new Date(dateValue);
            return isNaN(native.getTime()) ? null : native;
        }
        return null;
    };

    const filteredCommissions = React.useMemo(() => {
        if (!commissions) return [];

        const rangeStart = date?.from ? startOfDay(date.from) : null;
        const rangeEnd = date?.to ? endOfDay(date.to) : null;

        return commissions.filter(c => {
            // 1. Obtener y parsear fecha
            const rawDate = c.date || c.createdAt || c.paymentDate || c.fecha;
            const commissionDate = robustParseDate(rawDate);
            if (!commissionDate) return false;

            // 2. Filtro de Rango de Fechas
            const dateMatch = (rangeStart && rangeEnd) 
                ? isWithinInterval(commissionDate, { start: rangeStart, end: rangeEnd })
                : true;

            // 3. Filtro de Partner (compara contra ID y contra el nombre por si acaso)
            const cPartnerId = (c.partnerId || c.partner || '').toString().toLowerCase();
            const fPartnerId = selectedPartner.toLowerCase();
            const partnerMatch = selectedPartner === 'all' || cPartnerId === fPartnerId;
            
            // 4. Filtro de Estado (insensible a mayúsculas)
            const cStatus = (c.status || c.estado || '').toString().toLowerCase();
            const fStatus = selectedStatus.toLowerCase();
            const statusMatch = selectedStatus === 'all' || cStatus === fStatus;
            
            return dateMatch && partnerMatch && statusMatch;
        });
    }, [commissions, date, selectedPartner, selectedStatus]);

    // KPIs asegurando que los valores sean numéricos
    const totalCommissions = filteredCommissions.reduce((acc, c) => acc + (Number(c.earning || c.monto || 0)), 0);
    const paidCommissions = filteredCommissions
        .filter(c => (c.status || c.estado || '').toLowerCase().includes('pagado'))
        .reduce((acc, c) => acc + (Number(c.earning || c.monto || 0)), 0);
    const pendingCommissions = filteredCommissions
        .filter(c => (c.status || c.estado || '').toLowerCase().includes('pendiente'))
        .reduce((acc, c) => acc + (Number(c.earning || c.monto || 0)), 0);


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
          const rawDate = c.date || c.createdAt || c.paymentDate || c.fecha;
          const commissionDate = robustParseDate(rawDate);
          const formattedDate = commissionDate ? format(commissionDate, 'yyyy-MM-dd') : 'N/A';

          const row = [
            c.id,
            partnerNames[c.partnerId] || c.partnerId,
            formattedDate,
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
                                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                                            <SelectItem value="Pagado">Pagado</SelectItem>
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
                                                <TableCell className="font-medium">{partnerNames[c.partnerId] || c.partner || c.partnerId}</TableCell>
                                                <TableCell>{c.product || 'Venta Directa'}</TableCell>
                                                <TableCell>${(c.saleAmount || 0).toLocaleString()}</TableCell>
                                                <TableCell className="font-semibold text-primary">${(c.earning || c.monto || 0).toLocaleString()}</TableCell>
                                                <TableCell>
                                                  <Badge variant={(c.status || c.estado || '').toLowerCase().includes('pagado') ? 'default' : 'secondary'}>
                                                      {c.status || c.estado}
                                                  </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                             {!isLoading && filteredCommissions.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No se encontraron comisiones con los filtros seleccionados.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Verifica el rango de fechas y los filtros aplicados.</p>
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
