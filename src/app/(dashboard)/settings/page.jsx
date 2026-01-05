'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const ProfileSettings = () => {
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Función en desarrollo",
      description: "La actualización de perfiles estará disponible próximamente.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil Público</CardTitle>
        <CardDescription>
          Esta información será visible para otros miembros del programa.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" defaultValue="Alex" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="alex@example.com" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit">Guardar Cambios</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const AppearanceSettings = () => {
    const [theme, setTheme] = React.useState('light');

    React.useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }, [theme]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <CardDescription>
          Personaliza la apariencia de la aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Tema</Label>
          <p className="text-sm text-muted-foreground">
            Selecciona el tema para el panel de control.
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Claro</Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Oscuro</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationsSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones</CardTitle>
        <CardDescription>
          Gestiona cómo recibes las notificaciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="space-y-0.5">
            <Label className="text-base">Alertas de Rendimiento</Label>
            <p className="text-sm text-muted-foreground">
              Recibir notificaciones sobre caídas o picos de rendimiento.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between space-x-4">
          <div className="space-y-0.5">
            <Label className="text-base">Actualizaciones de Pagos</Label>
            <p className="text-sm text-muted-foreground">
              Recibir notificaciones cuando se procese un pago o haya un problema.
            </p>
          </div>
          <Switch defaultChecked/>
        </div>
        <div className="flex items-center justify-between space-x-4">
          <div className="space-y-0.5">
            <Label className="text-base">Hitos y Logros</Label>
            <p className="text-sm text-muted-foreground">
              Recibir notificaciones cuando alcances nuevos niveles o metas.
            </p>
          </div>
          <Switch />
        </div>
      </CardContent>
    </Card>
  );
};


export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona tu cuenta y la configuración de la aplicación.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}