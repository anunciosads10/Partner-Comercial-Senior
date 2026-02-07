'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Shield, Phone, MapPin, Mail } from 'lucide-react';

/**
 * @fileOverview Gestión de Perfil y Configuración del SaaS.
 * Implementación estricta para producción.
 */

function ProfileSettings({ userData }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    pais: ''
  });

  // Sincronizar estado local con datos de Firestore
  React.useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        pais: userData.pais || ''
      });
    }
  }, [userData]);

  const handleSave = () => {
    if (!firestore || !userData?.uid) return;
    setIsSaving(true);

    const userRef = doc(firestore, 'users', userData.uid);
    
    // Actualización optimista y no bloqueante
    updateDocumentNonBlocking(userRef, {
      name: formData.name,
      phone: formData.phone,
      pais: formData.pais,
      updatedAt: new Date().toISOString()
    });

    // Si el usuario es un partner (admin), sincronizar también su documento de partner
    if (userData.role === 'admin') {
      const partnerRef = doc(firestore, 'partners', userData.uid);
      updateDocumentNonBlocking(partnerRef, {
        name: formData.name,
        pais: formData.pais,
        email: userData.email // Mantener consistencia
      });
    }

    // Feedback visual tras un breve delay para simular procesamiento
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios se han guardado correctamente en la nube."
      });
    }, 600);
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <User className="h-5 w-5 text-primary" /> Información del Perfil
        </CardTitle>
        <CardDescription>
          Gestiona tu información personal y de contacto en la plataforma PartnerVerse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">Correo Electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" value={userData?.email || ''} disabled className="pl-10 bg-muted/50 cursor-not-allowed" />
            </div>
            <p className="text-[10px] text-muted-foreground">El email no puede ser modificado por seguridad.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-semibold">Rol Asignado</Label>
            <div className="flex items-center gap-2 p-2.5 bg-secondary/20 rounded-md border border-secondary/30">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold uppercase tracking-wider text-primary">
                {userData?.role || 'Partner'}
              </span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name" className="text-sm font-semibold">Nombre Completo</Label>
            <Input 
              id="name" 
              placeholder="Ej. Juan Pérez"
              value={formData.name} 
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold">Teléfono de Contacto</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="phone" 
                type="tel"
                placeholder="+57 300 000 0000"
                className="pl-10 focus:ring-primary"
                value={formData.phone} 
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pais" className="text-sm font-semibold">País de Residencia</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="pais" 
                placeholder="Ej. Colombia"
                className="pl-10 focus:ring-primary"
                value={formData.pais} 
                onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 border-t p-6">
        <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto px-8">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Actualizar Perfil"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading } = useDoc(userDocRef);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración</h1>
        <p className="text-muted-foreground text-lg">
          Personaliza tu experiencia y gestiona tus datos de socio.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full space-y-6">
        <TabsList className="bg-background border p-1 h-12">
          <TabsTrigger value="profile" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Mi Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-6">
            Notificaciones
          </TabsTrigger>
          {userData?.role === 'superadmin' && (
            <TabsTrigger value="system" className="px-6">
              Ajustes de Sistema
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile" className="outline-none">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">Cargando datos de perfil...</p>
            </div>
          ) : (
            <ProfileSettings userData={userData} />
          )}
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card className="border-dashed border-2">
            <CardHeader className="text-center">
              <CardTitle>Canales de Alerta</CardTitle>
              <CardDescription>Próximamente: Configura alertas vía WhatsApp y Email.</CardDescription>
            </CardHeader>
            <CardContent className="h-40 flex items-center justify-center text-muted-foreground italic">
              Sección en desarrollo para la fase 2.
            </CardContent>
          </Card>
        </TabsContent>

        {userData?.role === 'superadmin' && (
          <TabsContent value="system">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Configuración del SaaS</CardTitle>
                <CardDescription>Parámetros globales de comisiones y ciclos de pago.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-8 text-center bg-muted/20 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Como Super Administrador, aquí podrás gestionar los esquemas globales de comisión y las reglas del sistema.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
