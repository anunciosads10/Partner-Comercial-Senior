import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones Automáticas</CardTitle>
        <CardDescription>
          Configura alertas y notificaciones para los partners.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-secondary">
          <p className="text-muted-foreground">Configuración de notificaciones próximamente.</p>
        </div>
      </CardContent>
    </Card>
  );
}
