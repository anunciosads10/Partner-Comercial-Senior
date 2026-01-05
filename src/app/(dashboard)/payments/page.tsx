import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function PaymentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments & Billing</CardTitle>
        <CardDescription>
          Configure payment cycles and view payment history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
          <p className="text-muted-foreground">Payments and billing management coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
