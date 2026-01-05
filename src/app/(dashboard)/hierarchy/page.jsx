import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function HierarchyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jerarquía de Partners</CardTitle>
        <CardDescription>
          Visualiza las jerarquías de partners y la distribución de comisiones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg bg-secondary">
          <p className="text-muted-foreground">Visualización del árbol de partners próximamente.</p>
        </div>
      </CardContent>
    </Card>
  );
}
