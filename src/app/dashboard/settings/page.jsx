'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CalendarDays, Loader2, ChevronRight, QrCode } from 'lucide-react';
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
        toast({ title: 'Configuración Guardada' });
      } catch (error) { console.error(error); } finally { setIsSaving(false); }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays /> Ciclos de Pago</CardTitle>
                <CardDescription>Define la frecuencia de pago a partners.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Frecuencia</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="biweekly">Quincenal</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Día de Pago</Label>
                    <Input type="number" value={paymentDay} onChange={(e) => setPaymentDay(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSavePaymentCycles} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Ciclos
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
        </TabsList>
        <TabsContent value="payments"><PaymentSettings /></TabsContent>
        <TabsContent value="profile"><Card className="p-6">Gestión de perfil disponible próximamente.</Card></TabsContent>
      </Tabs>
    </div>
  );
}
