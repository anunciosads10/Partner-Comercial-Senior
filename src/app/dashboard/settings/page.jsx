'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '@/components/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, MapPin, Phone, ShieldCheck } from 'lucide-react';

function ProfileSettings({ userData }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: userData?.name || '',
    pais: userData?.pais || '',
    phone: userData?.phone || ''
  });

  React.useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        pais: userData.pais || '',
        phone: userData.phone || ''
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!firestore || !userData?.uid) return;
    setIsSaving(true);
    
    try {
      // Actualizar en la colección de usuarios
      const userRef = doc(firestore, 'users', userData.uid);
      await updateDoc(userRef, { name: formData.name });

      // Si es un partner, actualizar también en la colección de partners
      if (userData.role === 'admin') {
        const partnerRef = doc(firestore, 'partners', userData.uid);
        await updateDoc(partnerRef, {
          name: formData.name,
          pais: formData.pais,
          'paymentInfo.phone': formData.phone
        });
      }

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios se han guardado correctamente."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los cambios."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" /> Información Personal
        </CardTitle>
        <CardDescription>
          Gestiona los datos básicos de tu cuenta en PartnerVerse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (No editable)</Label>
            <Input id="email" value={userData?.email || ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pais" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> País de Residencia
            </Label>
            <Input 
              id="pais" 
              value={formData.pais} 
              onChange={(e) => setFormData({...formData, pais: e.target.value})}
              placeholder="Ej: Colombia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Teléfono / WhatsApp
            </Label>
            <Input 
              id="phone" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Ej: +57 300 123 4567"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg border border-primary/20">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Rol Asignado</p>
            <p className="text-xs text-muted-foreground uppercase">{userData?.role || 'Admin'}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">Administra tu perfil y preferencias del sistema.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <ProfileSettings userData={userData} />
          </TabsContent>
          
          <TabsContent value="system" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias del Sistema</CardTitle>
                <CardDescription>Configuración global de la plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Funcionalidades de configuración avanzada disponibles próximamente.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
