'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { CalendarDays, Loader2, User, Mail, ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PaymentSettings = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);
    const [frequency, setFrequency] = React.useState('monthly');
    const [paymentDay, setPaymentDay] = React.useState('15');

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'paymentCycles') : null, [firestore]);
    const { data: paymentSettings, isLoading } = useDoc(settingsRef);

    React.useEffect(() => {
        if (paymentSettings) {
            setFrequency(paymentSettings.frequency || 'monthly');
            setPaymentDay(paymentSettings.paymentDay || '15');
        }
    }, [paymentSettings]);
    
    const handleSavePaymentCycles = async () => {
      if (!firestore) return;
      setIsSaving(true);
      try {
        await setDoc(settingsRef, { frequency, paymentDay }, { merge: true });
        toast({ title: 'Configuración de Pagos Guardada' });
      } catch (error) { 
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la configuración.' });
      } finally { setIsSaving(false); }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <Card className="shadow-md border-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays className="text-primary" /> Ciclos de Pago</CardTitle>
                <CardDescription>Define la frecuencia de pago a partners y el día del mes en que se procesan.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Frecuencia de Liquidación</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="biweekly">Quincenal (15 y 30)</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Día de Pago (Número del 1 al 31)</Label>
                    <Input 
                        type="number" 
                        min="1" 
                        max="31" 
                        value={paymentDay} 
                        onChange={(e) => setPaymentDay(e.target.value)}
                        className="bg-background"
                    />
                </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button onClick={handleSavePaymentCycles} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Actualizar Ciclos de Pago
                </Button>
            </CardFooter>
        </Card>
    );
};

const UserProfileSettings = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);
    
    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userData, isLoading } = useDoc(userDocRef);
    
    const [formData, setFormData] = React.useState({
        name: '',
        email: ''
    });

    React.useEffect(() => {
        if (userData) {
            setFormData({
                name: userData.name || '',
                email: userData.email || ''
            });
        }
    }, [userData]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!firestore || !user || !userDocRef) return;
        
        if (!formData.name.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'El nombre no puede estar vacío.' });
            return;
        }

        setIsSaving(true);
        try {
            await updateDoc(userDocRef, {
                name: formData.name.trim(),
            });
            toast({ title: 'Perfil Actualizado', description: 'Tus datos personales han sido guardados con éxito.' });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al intentar actualizar el perfil.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <form onSubmit={handleSaveProfile}>
            <Card className="shadow-md border-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="text-primary" /> Gestión de Perfil</CardTitle>
                    <CardDescription>Administra tu información personal dentro de la plataforma PartnerVerse.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="flex items-center gap-2 font-semibold"><User size={14} className="text-muted-foreground" /> Nombre Completo</Label>
                        <Input 
                            id="name" 
                            placeholder="Ej: Alejandro Pérez"
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            required 
                            className="bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="flex items-center gap-2 font-semibold"><Mail size={14} className="text-muted-foreground" /> Correo Electrónico</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            value={formData.email} 
                            disabled 
                            className="bg-muted font-mono text-xs cursor-not-allowed opacity-80"
                        />
                        <p className="text-[10px] text-muted-foreground italic px-1">* El correo electrónico está vinculado a tu cuenta de autenticación y no puede modificarse aquí.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2 font-semibold"><ShieldCheck size={14} className="text-muted-foreground" /> Rol Administrativo</Label>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-secondary">
                            <Badge variant="default" className="px-4 py-1 uppercase tracking-wider font-bold text-[10px]">
                                {userData?.role || 'Admin'}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">Este nivel de acceso define tus permisos en el sistema PartnerVerse.</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6 bg-secondary/5 rounded-b-lg">
                    <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Guardar Cambios del Perfil
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configuración del Sistema</h1>
        <p className="text-muted-foreground text-sm">Ajusta los parámetros globales y administra tu identidad en la plataforma.</p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] border">
          <TabsTrigger value="profile">Perfil de Usuario</TabsTrigger>
          <TabsTrigger value="payments">Pagos y Ciclos</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
            <UserProfileSettings />
        </TabsContent>
        <TabsContent value="payments" className="mt-6">
            <PaymentSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
