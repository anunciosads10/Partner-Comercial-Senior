'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Shield, Phone, MapPin, Mail, CreditCard } from 'lucide-react';

/**
 * @fileOverview Gestión de Perfil y Configuración para SuperAdmin y Admins.
 * Implementación estricta para producción con sincronización multi-colección.
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
    
    // Actualización del perfil de usuario
    updateDocumentNonBlocking(userRef, {
      name: formData.name,
      phone: formData.phone,
      pais: formData.pais,
      updatedAt: new Date().toISOString()
    });

    // Sincronización con el documento de Partner si aplica
    if (userData.role === 'admin' || userData.role === 'superadmin') {
      const partnerRef = doc(firestore, 'partners', userData.uid);
      updateDocumentNonBlocking(partnerRef, {
        name: formData.name,
        pais: formData.pais,
        email: userData.email
      });
    }

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente en Firestore."
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
          Gestiona tu información de contacto y visibilidad en PartnerVerse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Email (No editable)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={userData?.email || ''} disabled className="pl-10 bg-muted/50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Rol en el Sistema</Label>
            <div className="flex items-center gap-2 p-2.5 bg-secondary/20 rounded-md border border-secondary/30">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold uppercase text-primary">
                {userData?.role || 'Partner'}
              </span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name" className="text-sm font-semibold">Nombre Completo</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold">Teléfono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="phone" 
                className="pl-10"
                value={formData.phone} 
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pais" className="text-sm font-semibold">País</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="pais" 
                className="pl-10"
                value={formData.pais} 
                onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 border-t p-6">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaving ? "Guardando..." : "Actualizar Perfil"}
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tu perfil y preferencias del sistema.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="billing">Pagos</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : (
            <ProfileSettings userData={userData} />
          )}
        </TabsContent>
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Información de Pago</CardTitle>
              <CardDescription>Próximamente: Configura tus métodos de retiro de comisiones.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
