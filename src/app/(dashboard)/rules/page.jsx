import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function RulesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reglas y Gobernanza</CardTitle>
        <CardDescription>
          Define políticas del programa, reglas antifraude y términos de servicio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
          <p className="text-muted-foreground">Configuración de reglas y gobernanza próximamente.</p>
        </div>
      </CardContent>
    </Card>
  );
}
