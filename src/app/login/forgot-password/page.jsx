'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getAuth, sendPasswordResetEmail } from "firebase/auth"; // Importes de Firebase

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña."
      });
    } catch (error) {
      let message = "No se pudo enviar el correo.";
      if (error.code === 'auth/user-not-found') message = "No existe una cuenta con este correo.";
      
      toast({
        variant: "destructive",
        title: "Error",
        description: message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" /> Recuperar Contraseña
          </CardTitle>
          <CardDescription>
            {isSent 
              ? "Te hemos enviado un enlace. Si no lo ves, revisa la carpeta de spam."
              : "Introduce tu email y te enviaremos un enlace para que vuelvas a entrar en tu cuenta."}
          </CardDescription>
        </CardHeader>
        
        {!isSent ? (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@ejemplo.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar enlace de recuperación
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setIsSent(false)}>
              Intentar con otro correo
            </Button>
          </CardContent>
        )}
        
        <CardFooter>
          <Link href="/login" className="text-sm text-primary hover:underline flex items-center gap-2 mx-auto">
            <ArrowLeft size={14} /> Volver al inicio de sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
