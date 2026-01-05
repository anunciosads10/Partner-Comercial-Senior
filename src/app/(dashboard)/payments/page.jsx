import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function PaymentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagos y Facturación</CardTitle>
        <CardDescription>
          Configura ciclos de pago y visualiza el historial de pagos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
          <p className="text-muted-foreground">Gestión de pagos y facturación próximamente.</p>
        </div>
      </CardContent>
    </Card>
  );
}
