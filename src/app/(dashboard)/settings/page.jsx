import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración</CardTitle>
        <CardDescription>
          Gestiona tu cuenta y la configuración de la aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
          <p className="text-muted-foreground">Configuración de la aplicación próximamente.</p>
        </div>
      </CardContent>
    </Card>
  );
}
