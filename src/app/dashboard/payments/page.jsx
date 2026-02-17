'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '../../../components/authenticated-layout';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '../../../firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { 
  CreditCard, 
  Loader2, 
  Download, 
  Filter, 
  FileText, 
  Printer, 
  Calendar,
  CheckCircle2,
  FileDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '../../../components/ui/dialog';
import { Separator } from '../../../components/ui/separator';
import { useToast } from '../../../hooks/use-toast';
import { jsPDF } from 'jspdf';

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

  /**
   * Genera y descarga un recibo PDF profesional utilizando jsPDF.
   */
  const handleDownloadPDF = () => {
    if (!selectedPayment) return;

    try {
      const doc = new jsPDF();
      
      // Estilo Corporativo PartnerVerse
      doc.setFontSize(22);
      doc.setTextColor(63, 81, 181); // Deep Indigo (#3F51B5)
      doc.setFont("helvetica", "bold");
      doc.text("PARTNERVERSE", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("COMPROBANTE OFICIAL DE LIQUIDACIÓN", 105, 28, { align: "center" });
      
      // Línea divisoria
      doc.setDrawColor(200);
      doc.line(20, 35, 190, 35);
      
      // Información de la transacción
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.setFont("helvetica", "bold");
      doc.text("DETALLES DEL PAGO", 20, 50);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`ID Referencia: ${selectedPayment.id}`, 20, 60);
      doc.text(`Fecha Emisión: ${selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString() : 'N/A'}`, 20, 67);
      doc.text(`Beneficiario: ${userData?.name || 'Socio PartnerVerse'}`, 20, 74);
      
      doc.line(20, 85, 190, 85);
      
      doc.setFont("helvetica", "bold");
      doc.text("CONCEPTO DE LIQUIDACIÓN", 20, 95);
      doc.setFont("helvetica", "normal");
      doc.text(selectedPayment.description || "Comisiones devengadas por ventas SaaS", 20, 105);
      
      // Cuadro de Total resaltado
      doc.setFillColor(245, 247, 249);
      doc.rect(20, 120, 170, 25, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(0, 150, 136); // Teal Accent (#009688)
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL NETO PAGADO:", 30, 137);
      doc.text(`$${selectedPayment.amount?.toLocaleString() || '0'}`, 180, 137, { align: "right" });
      
      // Pie de página institucional
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Documento generado automáticamente por el sistema PartnerVerse.", 105, 160, { align: "center" });
      doc.text("Este recibo tiene validez como soporte contable digital.", 105, 165, { align: "center" });

      // Ejecutar descarga física del archivo
      doc.save(`recibo-partnerverse-${selectedPayment.id}.pdf`);
      
      toast({
        title: "Exportación Exitosa",
        description: "El recibo PDF ha sido generado y descargado.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de Generación",
        description: "No se pudo procesar el documento PDF.",
      });
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
              <CreditCard className="h-8 w-8" /> Pagos
            </h1>
            <p className="text-muted-foreground text-sm">Historial de liquidaciones y transacciones.</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
        </div>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Transacciones</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 gap-2"><Filter className="h-4 w-4" /> Filtrar</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{payment.description || 'Comisión'}</TableCell>
                    <TableCell><span className="font-bold text-primary">${payment.amount?.toLocaleString()}</span></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(payment)}>Ver Recibo</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog 
          open={!!selectedPayment} 
          onOpenChange={(open) => {
            if (!open) setSelectedPayment(null);
          }}
        >
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader className="space-y-3 pb-4 border-b">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <DialogTitle className="text-xl font-black uppercase">Recibo de Pago</DialogTitle>
              </div>
              <DialogDescription>Detalles oficiales de la transacción.</DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <div className="py-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">ID Transacción</p>
                    <p className="font-mono text-sm">{selectedPayment.id}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Estado</p>
                    <Badge variant="outline" className="text-accent border-accent/20">Procesado</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <p className="text-lg font-bold text-muted-foreground">Total Liquidado</p>
                  <p className="text-2xl font-black text-primary">${selectedPayment.amount?.toLocaleString()}</p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" className="gap-2" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimir</Button>
              <Button variant="outline" className="gap-2 text-primary border-primary/20" onClick={handleDownloadPDF}><FileDown className="h-4 w-4" /> PDF</Button>
              <Button onClick={() => setSelectedPayment(null)}>Cerrar Ventana</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
