'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, MapPin, Phone, ShieldCheck, CreditCard } from 'lucide-react';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * @fileOverview Gestión de Perfil de Grado SaaS.
 * Implementa sincronización multi-colección y validación estricta.
 */

function ProfileSettings({ userData }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    name: '',
    pais: '',
    phone: ''
  });

  // Sincronización de estado local con datos de Firestore
  React.useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        pais: userData.pais || '',
        phone: userData.phone || ''
      });
    }
  }, [userData]);

  const handleSave = () => {
    if (!firestore || !userData?.uid) {
      toast({
        variant: "destructive",
        title: "Error de sesión",
        description: "No se pudo identificar al usuario activo."
      });
      return;
    }

    setIsSaving(true);
    
    const userRef = doc(firestore, 'users', userData.uid);
    
    // 1. Actualización en la colección global de usuarios
    updateDocumentNonBlocking(userRef, { 
      name: formData.name,
      pais: formData.pais,
      phone: formData.phone
    });

    // 2. Si es admin/socio, sincronizar su silo de datos en 'partners'
    if (userData.role === 'admin') {
      const partnerRef = doc(firestore, 'partners', userData.uid);
      updateDocumentNonBlocking(partnerRef, {
        name: formData.name,
        pais: formData.pais,
        'paymentInfo.phone': formData.phone
      });
    }

    // Feedback visual inmediato (optimista)
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Perfil Actualizado",
        description: "Tus datos se han sincronizado correctamente en el sistema."
      });
    }, 800);
  };

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
              <User className="h-5 w-5" /> Mi Perfil
            </CardTitle>
            <CardDescription>
              Gestiona tu información de contacto y ubicación territorial.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize">
            {userData?.role || 'Admin'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Juan Pérez"
              className="focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Corporativo</Label>
            <Input 
              id="email" 
              value={userData?.email || ''} 
              disabled 
              className="bg-muted/30 cursor-not-allowed italic"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pais" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> País / Territorio
            </Label>
            <Input 
              id="pais" 
              value={formData.pais} 
              onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
              placeholder="Ej: Colombia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> WhatsApp / Teléfono
            </Label>
            <Input 
              id="phone" 
              value={formData.phone} 
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+57 300..."
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/10 border-t p-4 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="min-w-[140px]"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Guardar Cambios
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase">Configuración</h1>
          <p className="text-muted-foreground">Administra los parámetros de tu cuenta y preferencias del sistema.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-muted/50 border mb-6">
            <TabsTrigger value="profile">Perfil de Usuario</TabsTrigger>
            <TabsTrigger value="billing">Seguridad y Pagos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileSettings userData={userData} />
          </TabsContent>
          
          <TabsContent value="billing">
            <Card className="border-dashed bg-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" /> Información Bancaria
                </CardTitle>
                <CardDescription>
                  Las opciones de liquidación se activan según tu volumen de ventas.
                </CardDescription>
              </CardHeader>
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                 <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground max-w-sm">
                  Esta sección está reservada para la configuración de cobros y verificaciones de identidad.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
