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
import { format, subYears, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { DateRangePicker } from '@/components/ui/date-range-picker';

const ReportsPage = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // FETCH DE AMBAS COLECCIONES: Comisiones y Pagos
    const commissionsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'commissions') : null, [firestore]);
    const paymentsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'payments') : null, [firestore]);
    const partnersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'partners') : null, [firestore]);
    
    const { data: commissions, isLoading: isLoadingCommissions } = useCollection(commissionsCollection);
    const { data: payments, isLoading: isLoadingPayments } = useCollection(paymentsCollection);
    const { data: partners, isLoading: isLoadingPartners } = useCollection(partnersCollection);
    
    const [date, setDate] = React.useState({ from: subYears(new Date(), 1), to: new Date() });
    const [selectedPartner, setSelectedPartner] = React.useState('all');
    const [selectedStatus, setSelectedStatus] = React.useState('all');

    const partnerNames = React.useMemo(() => {
        if (!partners) return {};
        return partners.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});
    }, [partners]);

    // Función para procesar fechas de forma flexible (ISO String, Timestamp o Date)
    const robustParseDate = (dateValue) => {
        if (!dateValue) return null;
        if (dateValue.toDate) return dateValue.toDate();
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
    };

    const combinedAndFilteredData = React.useMemo(() => {
        // Combinamos ambas colecciones para tener el panorama completo
        const allData = [...(commissions || []), ...(payments || [])];
        if (allData.length === 0) return [];

        const rangeStart = date?.from ? startOfDay(date.from) : null;
        const rangeEnd = date?.to ? endOfDay(date.to) : null;

        return allData.filter(item => {
            // 1. Fecha: verificamos campos de ambas colecciones
            const rawDate = item.paymentDate || item.paidAt || item.date || item.createdAt;
            const itemDate = robustParseDate(rawDate);
            if (!itemDate) return false;

            const dateMatch = (rangeStart && rangeEnd) 
                ? isWithinInterval(itemDate, { start: rangeStart, end: rangeEnd })
                : true;

            // 2. Partner: Comparamos contra ID y contra el nombre directo (como "alexjf")
            const partnerId = (item.partnerId || '').toLowerCase();
            const partnerName = (item.partnerName || item.partner || '').toLowerCase();
            const filterValue = selectedPartner.toLowerCase();
            
            const partnerMatch = selectedPartner === 'all' || 
                                 partnerId === filterValue || 
                                 partnerName === filterValue;
            
            // 3. Estado
            const status = (item.status || '').toLowerCase();
            const statusFilter = selectedStatus.toLowerCase();
            const statusMatch = selectedStatus === 'all' || status === statusFilter;
            
            return dateMatch && partnerMatch && statusMatch;
        });
    }, [commissions, payments, date, selectedPartner, selectedStatus]);
    
    const handleExport = () => {
        if (!combinedAndFilteredData || combinedAndFilteredData.length === 0) {
          toast({
            variant: "destructive",
            title: "No hay datos para exportar",
            description: "No hay datos que coincidan con los filtros actuales.",
          });
          return;
        }
    
        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = ["Partner", "Concepto", "Fecha", "Monto", "Estado"];
        csvContent += headers.join(",") + "\r\n";
    
        combinedAndFilteredData.forEach(item => {
          const row = [
            item.partnerName || partnerNames[item.partnerId] || item.partner || 'N/A',
            item.product || 'Pago Registrado',
            robustParseDate(item.paymentDate || item.paidAt || item.date)?.toLocaleDateString() || 'N/A',
            (Number(item.amount || item.earning || 0)),
            item.status || 'N/A'
          ];
          csvContent += row.join(",") + "\r\n";
        });
    
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reporte_financiero.csv");
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        
        toast({
            title: "Reporte Generado",
            description: "La descarga de tu reporte ha comenzado.",
        });
    };

    // KPIs usando 'amount' o 'earning' indistintamente
    const total = combinedAndFilteredData.reduce((acc, item) => acc + (Number(item.amount || item.earning || 0)), 0);
    const paid = combinedAndFilteredData
        .filter(item => (item.status || '').toLowerCase().includes('pagado'))
        .reduce((acc, item) => acc + (Number(item.amount || item.earning || 0)), 0);
    const pending = combinedAndFilteredData
        .filter(item => (item.status || '').toLowerCase().includes('pendiente'))
        .reduce((acc, item) => acc + (Number(item.amount || item.earning || 0)), 0);

    const isLoading = isLoadingCommissions || isLoadingPayments || isLoadingPartners;

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
                            <CardDescription>Análisis consolidado de comisiones y pagos realizados.</CardDescription>
                        </div>
                         <Button onClick={handleExport} variant="outline" disabled={isLoading || combinedAndFilteredData.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar Reporte
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <KpiCard title="Total General" value={isLoading ? <Loader2 className="animate-spin" /> : `$${total.toLocaleString()}`} Icon={DollarSign} />
                        <KpiCard title="Total Pagado" value={isLoading ? <Loader2 className="animate-spin" /> : `$${paid.toLocaleString()}`} Icon={CheckCircle} />
                        <KpiCard title="Total Pendiente" value={isLoading ? <Loader2 className="animate-spin" /> : `$${pending.toLocaleString()}`} Icon={Clock} />
                    </div>

                    <Card className="bg-secondary/50">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Partner</Label>
                                    <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Partners</SelectItem>
                                            {partners?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Estado</Label>
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
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

                    <Card>
                        <CardHeader><CardTitle>Detalle de Movimientos</CardTitle></CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Partner</TableHead>
                                            <TableHead>Concepto</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {combinedAndFilteredData.map((item, idx) => (
                                            <TableRow key={item.id || idx}>
                                                <TableCell className="font-medium">
                                                    {item.partnerName || partnerNames[item.partnerId] || item.partner || 'N/A'}
                                                </TableCell>
                                                <TableCell>{item.product || 'Pago Registrado'}</TableCell>
                                                <TableCell>{robustParseDate(item.paymentDate || item.paidAt || item.date)?.toLocaleDateString()}</TableCell>
                                                <TableCell className="font-semibold text-primary">
                                                    ${(Number(item.amount || item.earning || 0)).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={(item.status || '').toLowerCase() === 'pagado' ? 'default' : 'secondary'}>
                                                        {item.status || 'Pendiente'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                            {!isLoading && combinedAndFilteredData.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No se encontraron registros financieros.</p>
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
