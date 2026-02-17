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

/**
 * @fileOverview Página de historial de pagos y liquidaciones.
 * Implementa motor de exportación PDF corporativo y gestión de recibos.
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!selectedPayment) return;

    toast({
      title: "Generando PDF",
      description: "Construyendo documento oficial de liquidación...",
    });

    try {
      const doc = new jsPDF();
      
      // Branding Corporativo
      doc.setFontSize(24);
      doc.setTextColor(59, 130, 246); // Primary Blue
      doc.setFont("helvetica", "bold");
      doc.text("PARTNERVERSE", 105, 25, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("SISTEMA DE GESTIÓN DE SOCIOS SAAS - COMPROBANTE OFICIAL", 105, 32, { align: "center" });
      
      doc.setDrawColor(220);
      doc.line(20, 40, 190, 40);
      
      // Título del Recibo
      doc.setFontSize(16);
      doc.setTextColor(30);
      doc.setFont("helvetica", "bold");
      doc.text("RECIBO DE LIQUIDACIÓN DE COMISIONES", 20, 55);
      
      // Información de Transacción
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`ID TRANSACCIÓN: ${selectedPayment.id}`, 20, 65);
      doc.text(`ESTADO: PROCESADO`, 190, 65, { align: "right" });
      
      doc.line(20, 72, 190, 72);
      
      // Detalles del Beneficiario
      doc.setTextColor(60);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL SOCIO", 20, 85);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Nombre: ${userData?.name || 'Socio Verificado'}`, 20, 95);
      doc.text(`Email: ${user?.email || 'N/A'}`, 20, 102);
      doc.text(`Fecha: ${selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString('es-CO') : 'N/A'}`, 20, 109);
      
      doc.line(20, 118, 190, 118);
      
      // Concepto Financiero
      doc.setFont("helvetica", "bold");
      doc.text("CONCEPTO DE PAGO", 20, 130);
      
      doc.setFont("helvetica", "normal");
      const description = selectedPayment.description || 'Liquidación automática de comisiones por ventas en plataformas SaaS afiliadas.';
      const splitDescription = doc.splitTextToSize(description, 170);
      doc.text(splitDescription, 20, 140);
      
      doc.line(20, 155, 190, 155);
      
      // Resumen Financiero Destacado
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Primary Blue
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL LIQUIDADO:`, 20, 175);
      doc.text(`$${selectedPayment.amount?.toLocaleString('es-CO') || '0'}`, 190, 175, { align: "right" });
      
      doc.line(20, 185, 190, 185);
      
      // Footer Legal
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(180);
      const footerText = "Este documento constituye un comprobante digital oficial de PartnerVerse. La emisión de este recibo confirma que los fondos han sido procesados según los términos de servicio vigentes.";
      const splitFooter = doc.splitTextToSize(footerText, 170);
      doc.text(splitFooter, 105, 200, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.text("© 2024 PartnerVerse Platform. Todos los derechos reservados.", 105, 220, { align: "center" });

      doc.save(`recibo-partnerverse-${selectedPayment.id}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error de descarga",
        description: "No se pudo procesar la generación del archivo PDF.",
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
            <p className="text-muted-foreground text-sm">
              Historial de liquidaciones y transacciones de comisiones.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Transacciones Recientes</CardTitle>
              <CardDescription>Resumen detallado de pagos procesados.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <Filter className="h-4 w-4" /> Filtrar
            </Button>
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
                {payments && payments.length > 0 ? (
                  payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-xs">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('es-CO') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs">{payment.description || 'Liquidación de comisiones'}</TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">${payment.amount?.toLocaleString('es-CO') || '0'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[10px] uppercase font-bold text-accent hover:text-accent hover:bg-accent/10"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          Ver Recibo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                      No se registran pagos pendientes ni procesados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader className="space-y-3 pb-4 border-b">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <DialogTitle className="text-xl font-black uppercase">Recibo de Pago</DialogTitle>
              </div>
              <DialogDescription>
                Detalles oficiales de la transacción procesada por PartnerVerse.
              </DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <div className="py-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">ID de Transacción</p>
                    <p className="font-mono text-sm">{selectedPayment.id}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Estado</p>
                    <div className="flex items-center gap-1 text-accent justify-end">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="text-xs font-bold uppercase">Procesado</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Fecha
                    </p>
                    <p className="text-sm font-medium">
                      {selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString('es-CO', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Socio Beneficiario</p>
                    <p className="text-sm font-medium">{userData?.name || 'Socio Verificado'}</p>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Concepto</p>
                  <p className="text-sm italic">{selectedPayment.description || 'Liquidación automática de comisiones por ventas en plataformas SaaS afiliadas.'}</p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-lg font-bold text-muted-foreground">Total Liquidado</p>
                  <p className="text-2xl font-black text-primary">
                    ${selectedPayment.amount?.toLocaleString('es-CO') || '0'}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 text-primary border-primary/20" 
                onClick={handleDownloadPDF}
              >
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <Button onClick={() => setSelectedPayment(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
