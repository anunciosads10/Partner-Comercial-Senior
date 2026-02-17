'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { 
  CreditCard, 
  Loader2, 
  Download, 
  Filter, 
  FileText, 
  X,
  FileDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';

/**
 * @fileOverview Gestión de Pagos y Generación de Recibos de Liquidación.
 */
export default function PaymentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = React.useState(null);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData } = useDoc(userDocRef);

  const paymentsRef = useMemoFirebase(() => {
    if (!firestore || !userData || !user?.uid) return null;
    if (userData.role === 'superadmin') {
      return collection(firestore, 'payments');
    }
    return query(collection(firestore, 'payments'), where('partnerId', '==', user.uid));
  }, [firestore, userData, user?.uid]);

  const { data: payments, isLoading } = useCollection(paymentsRef);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase flex items-center gap-3">
              <CreditCard className="h-8 w-8" /> Historial de Pagos
            </h1>
            <p className="text-muted-foreground text-sm">Control administrativo de liquidaciones y comprobantes.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar Listado
          </Button>
        </div>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg">Transacciones Recientes</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 gap-2"><Filter className="h-4 w-4" /> Filtrar</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.length > 0 ? (
                  payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-xs font-medium">{payment.description || 'Liquidación de Comisiones'}</TableCell>
                      <TableCell><span className="font-bold text-primary">${payment.amount?.toLocaleString()}</span></TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] uppercase font-bold border-accent/20 text-accent">Procesado</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="font-bold text-xs" onClick={() => setSelectedPayment(payment)}>Ver Recibo</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">No se registran pagos.</TableCell></TableRow>
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
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b bg-muted/10">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <h2 className="text-xl font-black uppercase tracking-tight">Recibo de Pago</h2>
                </div>
                <button onClick={() => setSelectedPayment(null)} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-between border-t border-dashed pt-4 items-center">
                  <p className="text-lg font-bold text-muted-foreground">Monto Total</p>
                  <p className="text-3xl font-black text-primary">${selectedPayment.amount?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t bg-muted/10">
                <Button variant="outline" className="gap-2 text-primary border-primary/20" onClick={handleDownloadPDF}>
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
                <Button onClick={() => setSelectedPayment(null)}>Cerrar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
