'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, ChevronRight, QrCode, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const ProfileSettings = () => {
  const { toast } = useToast();
  const fileInputRef = React.useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Función en desarrollo",
      description: "La actualización de perfiles estará disponible próximamente.",
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Archivo seleccionado:", file.name);
      toast({
        title: "Imagen Seleccionada",
        description: `${file.name}`,
      });
      // Lógica para previsualizar y subir el archivo aquí
    }
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
           <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="https://picsum.photos/seed/1/200" alt="Avatar" />
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <div className="grid w-full gap-2">
                <Input id="avatar-url" placeholder="https://example.com/avatar.png" defaultValue="https://picsum.photos/seed/1/200"/>
                 <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Imagen
                </Button>
                <Input 
                    id="file-upload" 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Pega una URL o sube una imagen para actualizar tu avatar.
            </p>
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

const paymentOptions = [
  { id: 'nequi', name: 'Paga con Nequi' },
  { id: 'bancolombia', name: 'Paga con Bancolombia' },
  { id: 'daviplata', name: 'Paga con Daviplata' },
  { id: 'bre-b', name: 'Paga con Bre-B' },
  { id: 'cod', name: 'Pago contra entrega' },
];

const NequiConfigPanel = () => {
  const { toast } = useToast();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración Nequi</CardTitle>
        <CardDescription>Ajusta los detalles para recibir pagos a través de Nequi.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nequi-holder-name">Nombre del titular</Label>
          <Input id="nequi-holder-name" placeholder="Ej: Alex Rojas" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nequi-phone">Número de celular</Label>
          <Input id="nequi-phone" placeholder="Ej: 3001234567" />
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4"/>
            <span>Configurado correctamente</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => toast({ title: "Configuración guardada", description: "Tus datos de Nequi se han actualizado."})}>Guardar configuración Nequi</Button>
      </CardFooter>
    </Card>
  );
};

const BancolombiaConfigPanel = () => {
  const { toast } = useToast();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración Bancolombia</CardTitle>
        <CardDescription>Configura los datos para recibir pagos por transferencia a Bancolombia.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bancolombia-holder-name">Nombre del titular de la cuenta</Label>
          <Input id="bancolombia-holder-name" placeholder="Ej: Alex J. Rojas" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bancolombia-account-type">Tipo de cuenta</Label>
           <Select defaultValue="ahorros">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ahorros">Ahorros</SelectItem>
                <SelectItem value="corriente">Corriente</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bancolombia-account-number">Número de cuenta</Label>
          <Input id="bancolombia-account-number" placeholder="Ej: 123-456789-00" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-600"/>
            <span>Tus datos están guardados y verificados.</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => toast({ title: "Configuración guardada", description: "Tus datos de Bancolombia han sido actualizados."})}>Guardar Configuración</Button>
      </CardFooter>
    </Card>
  );
};

const DaviplataConfigPanel = () => {
  const { toast } = useToast();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración Daviplata</CardTitle>
        <CardDescription>Ajusta los detalles para recibir pagos a través de Daviplata.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="daviplata-holder-name">Nombre del titular</Label>
          <Input id="daviplata-holder-name" placeholder="Ej: Alex Rojas" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="daviplata-phone">Número de celular</Label>
          <Input id="daviplata-phone" placeholder="Ej: 3001234567" />
        </div>
         <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4"/>
            <span>Configurado correctamente</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => toast({ title: "Configuración guardada", description: "Tus datos de Daviplata se han actualizado."})}>Guardar configuración Daviplata</Button>
      </CardFooter>
    </Card>
  );
};

const BreBConfigPanel = () => {
  const { toast } = useToast();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración Bre-B</CardTitle>
        <CardDescription>Ajusta los detalles para recibir pagos a través de Bre-B.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="breb-holder-name">Nombre del titular / comercio</Label>
          <Input id="breb-holder-name" placeholder="Ej: Mi Tienda S.A.S" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="breb-key-type">Llave Bre-B</Label>
          <div className="flex gap-2">
            <Select defaultValue="celular">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celular">Celular</SelectItem>
                <SelectItem value="correo">Correo</SelectItem>
                <SelectItem value="documento">Documento</SelectItem>
                <SelectItem value="alfanumerico">Alfanumérico</SelectItem>
              </SelectContent>
            </Select>
            <Input id="breb-key-value" placeholder="Valor de la llave" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="breb-commerce-code">Código de Comercio Bre-B (Opcional)</Label>
          <Input id="breb-commerce-code" placeholder="Ej: 123456789" />
        </div>
        <div className="space-y-2">
          <Label>Código QR Bre-B</Label>
          <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg h-40 bg-muted">
            <div className="text-center text-muted-foreground">
              <QrCode className="mx-auto h-12 w-12"/>
              <p className="mt-2 text-sm">El código QR se generará al guardar.</p>
            </div>
          </div>
        </div>
         <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4"/>
            <span>Configurado correctamente</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => toast({ title: "Configuración guardada", description: "Tus datos de Bre-B se han actualizado."})}>Guardar configuración Bre-B</Button>
      </CardFooter>
    </Card>
  );
};


const PaymentSettings = () => {
    const [activeOption, setActiveOption] = React.useState('nequi');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuración de Pagos</CardTitle>
                <CardDescription>
                    Gestiona los métodos de pago que ofreces a tus partners.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 flex flex-col gap-2">
                        <Label>Opciones de Pago</Label>
                        {paymentOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setActiveOption(option.id)}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors",
                                    activeOption === option.id
                                        ? "bg-primary/10 border-primary text-primary font-semibold"
                                        : "hover:bg-muted/50"
                                )}
                            >
                                <span>{option.name}</span>
                                <ChevronRight className={cn("h-4 w-4", activeOption === option.id && "text-primary")} />
                            </button>
                        ))}
                    </div>

                    <div className="col-span-2">
                        {activeOption === 'nequi' && <NequiConfigPanel />}
                        {activeOption === 'bancolombia' && <BancolombiaConfigPanel />}
                        {activeOption === 'daviplata' && <DaviplataConfigPanel />}
                        {activeOption === 'bre-b' && <BreBConfigPanel />}
                        {activeOption !== 'nequi' && activeOption !== 'daviplata' && activeOption !== 'bre-b' && activeOption !== 'bancolombia' && (
                            <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg bg-secondary">
                                <div className="text-center text-muted-foreground">
                                    <p>Selecciona una opción de pago para configurarla.</p>
                                    <p className="text-sm">La configuración para "{paymentOptions.find(p => p.id === activeOption)?.name}" está en desarrollo.</p>
                                </div>
                            </div>
                        )}
                    </div>
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
          <TabsTrigger value="payments">Pagos</TabsTrigger>
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
        
        <TabsContent value="payments" className="space-y-4">
          <PaymentSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
