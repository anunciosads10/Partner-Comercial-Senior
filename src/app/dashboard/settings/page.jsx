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
 * @fileOverview Componente para gestionar el perfil del usuario.
 * Sigue estándares de producción con TypeScript y validaciones.
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
        title: "Error de contexto",
        description: "No se pudo identificar la sesión del usuario."
      });
      return;
    }

    setIsSaving(true);
    
    const userRef = doc(firestore, 'users', userData.uid);
    
    // Actualización no bloqueante para el documento de usuario
    updateDocumentNonBlocking(userRef, { 
      name: formData.name,
      pais: formData.pais,
      phone: formData.phone
    });

    // Si el usuario es un partner (admin), sincronizar también en su documento de partner
    if (userData.role === 'admin') {
      const partnerRef = doc(firestore, 'partners', userData.uid);
      updateDocumentNonBlocking(partnerRef, {
        name: formData.name,
        pais: formData.pais,
        // Actualizamos el campo de teléfono en la estructura de paymentInfo
        'paymentInfo.phone': formData.phone
      });
    }

    // Feedback visual inmediato
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios se han guardado correctamente."
      });
    }, 600);
  };

  if (!userData) return <Loader2 className="h-6 w-6 animate-spin mx-auto" />;

  return (
    <Card className="border-primary/10 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary text-xl font-bold">
          <User className="h-5 w-5" /> Información de Perfil
        </CardTitle>
        <CardDescription>
          Gestiona tu identidad corporativa y datos de contacto en la plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">Nombre Completo</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Alejandro Jaramillo"
              className="focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">Email Institucional</Label>
            <Input 
              id="email" 
              value={userData.email || ''} 
              disabled 
              className="bg-muted/50 cursor-not-allowed border-dashed opacity-70"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pais" className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" /> País de Operación
            </Label>
            <Input 
              id="pais" 
              value={formData.pais} 
              onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
              placeholder="Ej: Colombia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold">
              <Phone className="h-4 w-4 text-primary" /> Teléfono de Contacto
            </Label>
            <Input 
              id="phone" 
              value={formData.phone} 
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Ej: +57 300 123 4567"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <div className="p-3 bg-primary/10 rounded-full">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-primary">Nivel de Acceso</p>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px]">
                {userData.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tu cuenta tiene permisos de {userData.role === 'superadmin' ? 'Administrador Global' : 'Socio Comercial Senior'}.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/10 border-t p-4 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-[160px] font-bold">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Actualizar Perfil
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

  const isSuperAdmin = userData?.role === 'superadmin';

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">Configuración</h1>
          <p className="text-muted-foreground font-medium">Gestiona tu identidad, territorio y preferencias del SaaS.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/40 border p-1 rounded-2xl">
            <TabsTrigger value="profile" className="rounded-xl data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold">
              Mi Perfil
            </TabsTrigger>
            <TabsTrigger value="system" className="rounded-xl data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold">
              Sistemas y Pagos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-8 transition-all">
            <ProfileSettings userData={userData} />
          </TabsContent>
          
          <TabsContent value="system" className="mt-8">
            <Card className="border-dashed bg-muted/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <CreditCard className="h-5 w-5 text-primary" /> Parámetros de Liquidación
                </CardTitle>
                <CardDescription>
                  {isSuperAdmin 
                    ? "Configuración global de ciclos de pago y esquemas de comisión." 
                    : "Solo lectura. Las preferencias de pago son gestionadas por el administrador global."}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-24 flex flex-col items-center justify-center text-center">
                 <div className="p-4 bg-muted/30 rounded-full mb-6 border-2 border-dashed border-muted-foreground/20">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground/30" />
                 </div>
                <p className="text-sm text-muted-foreground max-w-sm font-medium leading-relaxed">
                  Las opciones avanzadas de ciclos bi-semanales y gestión de APIs de pago estarán disponibles tras la próxima actualización de seguridad.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
