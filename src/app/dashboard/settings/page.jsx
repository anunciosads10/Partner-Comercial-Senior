'use client';

import * as React from 'react';
import { AuthenticatedLayout } from '../../../components/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../../../firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, User, MapPin, Phone, ShieldCheck, CreditCard } from 'lucide-react';
import { updateDocumentNonBlocking } from '../../../firebase/non-blocking-updates';

function ProfileSettings({ userData }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    name: '',
    pais: '',
    phone: ''
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
    if (!firestore || !userData?.uid) {
      toast({
        variant: "destructive",
        title: "Error de sesión",
        description: "No se pudo identificar al usuario activo."
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const userRef = doc(firestore, 'users', userData.uid);
      
      updateDocumentNonBlocking(userRef, { 
        name: formData.name,
        pais: formData.pais,
        phone: formData.phone
      });

      if (userData.role === 'admin' || userData.role === 'superadmin') {
        const partnerRef = doc(firestore, 'partners', userData.uid);
        updateDocumentNonBlocking(partnerRef, {
          name: formData.name,
          pais: formData.pais
        });
      }

      toast({
        title: "Perfil Actualizado",
        description: "Tus datos se han sincronizado correctamente en el sistema."
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "Hubo un problema técnico al actualizar tu perfil."
      });
    } finally {
      setIsSaving(false);
    }
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
            {userData?.role || 'Socio'}
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
              placeholder="Ej. Alexander Jiménez"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Corporativo</Label>
            <Input id="email" value={userData?.email || ''} disabled className="bg-muted/30 cursor-not-allowed" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pais" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> País / Territorio
            </Label>
            <Input 
              id="pais" 
              value={formData.pais} 
              onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
              placeholder="Ej. Colombia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> Teléfono
            </Label>
            <Input 
              id="phone" 
              value={formData.phone} 
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Ej. +57 300 000 0000"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/10 border-t p-4 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
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
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

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
          <p className="text-muted-foreground">Administra los parámetros de tu cuenta y preferencias de socio.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-muted/50 border mb-6">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="security">Seguridad & Cobros</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileSettings userData={userData} />
          </TabsContent>
          
          <TabsContent value="security">
            <Card className="border-dashed bg-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" /> Información de Cobros
                </CardTitle>
                <CardDescription>Las opciones de liquidación se activan según tu volumen de comisiones.</CardDescription>
              </CardHeader>
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                 <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground max-w-sm">
                  Esta sección está reservada para la configuración de métodos de pago verificados una vez alcances el Tier Gold.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}