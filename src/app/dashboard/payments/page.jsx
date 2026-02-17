'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { 
  CreditCard, 
  Loader2, 
  Download, 
  Filter, 
  FileText, 
  X,
  FileDown,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';

export default function PaymentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedPayment, setSelectedPayment] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData } = useDoc(userDocRef);

  const paymentsRef = useMemoFirebase(() => {
    if (!firestore || !userData || !user?.uid) return null;
    
    if (userData.role === 'superadmin') {
      return query(collection(firestore, 'payments'), orderBy('paymentDate', 'desc'));
    }
    return query(
      collection(firestore, 'payments'), 
      where('partnerId', '==', user.uid),
      orderBy('paymentDate', 'desc')
    );
  }, [firestore, userData, user?.uid]);

  const { data: rawPayments, isLoading } = useCollection(paymentsRef);

  const filteredPayments = React.useMemo(() => {
    if (!rawPayments) return [];
    return rawPayments.filter(payment => {
      const matchesSearch = !searchQuery || 
        payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || (payment.status?.toLowerCase() === statusFilter.toLowerCase());
      
      return matchesSearch && matchesStatus;
    });
  }, [rawPayments, searchQuery, statusFilter]);

  const handleDownloadPDF = () => {
    if (!selectedPayment) return;

    try {
      const docPDF = new jsPDF();
      docPDF.setFontSize(22);
      docPDF.setTextColor(63, 81, 181);
      docPDF.setFont("helvetica", "bold");
      docPDF.text("PARTNERVERSE", 105, 20, { align: "center" });
      
      docPDF.setFontSize(10);
      docPDF.setTextColor(100);
      docPDF.text("COMPROBANTE OFICIAL DE LIQUIDACIÓN", 105, 28, { align: "center" });
      
      docPDF.line(20, 35, 190, 35);
      
      docPDF.setFontSize(14);
      docPDF.setTextColor(40);
      docPDF.text("DETALLES DEL PAGO", 20, 50);
      
      docPDF.setFontSize(10);
      docPDF.setFont("helvetica", "normal");
      docPDF.text(`ID Referencia: ${selectedPayment.id}`, 20, 60);
      docPDF.text(`Fecha Emisión: ${selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString() : 'N/A'}`, 20, 67);
      docPDF.text(`Beneficiario: ${userData?.name || 'Socio PartnerVerse'}`, 20, 74);
      
      docPDF.setFillColor(245, 247, 249);
      docPDF.rect(20, 120, 170, 25, 'F');
      
      docPDF.setFontSize(16);
      docPDF.setTextColor(0, 150, 136);
      docPDF.setFont("helvetica", "bold");
      docPDF.text("TOTAL NETO PAGADO:", 30, 137);
      docPDF.text(`$${selectedPayment.amount?.toLocaleString() || '0'}`, 180, 137, { align: "right" });
      
      docPDF.save(`recibo-partnerverse-${selectedPayment.id}.pdf`);
      toast({ title: "Recibo Generado", description: "Documento PDF descargado correctamente." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo generar el recibo." });
    }
  };

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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
              <CreditCard className="h-8 w-8" /> Historial de Pagos
            </h1>
            <p className="text-muted-foreground text-sm">Control administrativo de liquidaciones y comprobantes.</p>
          </div>
          <Button variant="outline" className="gap-2 font-bold shadow-sm">
            <Download className="h-4 w-4" /> Exportar Listado
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-primary/10 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por ID o descripción..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-3 h-3 mr-2 opacity-50" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Pagado">Pagado</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Fallido">Fallido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg uppercase font-black tracking-tight">Transacciones ({filteredPayments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción / ID</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs font-medium">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase">{payment.description || 'Liquidación de Comisiones'}</span>
                          <span className="text-[9px] font-mono text-muted-foreground opacity-60">ID: {payment.id}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="font-bold text-primary">${payment.amount?.toLocaleString()}</span></TableCell>
                      <TableCell>
                        <Badge 
                          variant={payment.status === 'Pagado' ? 'default' : payment.status === 'Fallido' ? 'destructive' : 'outline'} 
                          className="text-[10px] uppercase font-black px-3"
                        >
                          {payment.status || 'Procesado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="font-black text-[10px] uppercase tracking-tighter hover:bg-primary/10 hover:text-primary" 
                          onClick={() => setSelectedPayment(payment)}
                        >
                          Ver Recibo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">
                      No se encontraron registros que coincidan con los filtros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedPayment && (
          <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4" 
            onClick={() => setSelectedPayment(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b bg-muted/10">
                <div className="flex items-center gap-3 text-primary">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Recibo de Pago</h2>
                </div>
                <button onClick={() => setSelectedPayment(null)} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col items-center justify-center py-4 bg-muted/20 rounded-xl border border-dashed border-primary/20">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Monto de Liquidación</p>
                  <p className="text-4xl font-black text-primary">${selectedPayment.amount?.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">ID Transacción</span>
                    <span className="font-mono font-bold">{selectedPayment.id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Fecha</span>
                    <span className="font-bold">{selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Beneficiario</span>
                    <span className="font-bold">{userData?.name || 'Socio Activo'}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t bg-muted/10">
                <Button variant="outline" className="gap-2 text-primary border-primary/20 font-bold" onClick={handleDownloadPDF}>
                  <FileDown className="h-4 w-4" /> Descargar PDF
                </Button>
                <Button onClick={() => setSelectedPayment(null)} className="font-bold">Cerrar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
