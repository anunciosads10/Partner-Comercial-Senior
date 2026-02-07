'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <svg
            className="w-8 h-8 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 7L12 12L22 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 12V22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="ml-2 text-lg font-bold">PartnerVerse</span>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Link href="/register">
            <Button variant="outline">Crear Cuenta</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}


export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setError('');
    
    if (!auth) {
      setError('El servicio de autenticación no está disponible.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Redirigir explícitamente al dashboard después del éxito
      router.push('/dashboard');
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Credenciales inválidas. Por favor, revisa tu email y contraseña.');
      } else {
        setError('Error al iniciar sesión. Por favor, inténtalo de nuevo.');
        console.error(err);
      }
    }
  };


  return (
     <div className="flex flex-col min-h-screen bg-slate-50">
      <LandingHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Introduce tu email para acceder a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
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
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link 
                    href="/login/forgot-password" 
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleSignIn} className="w-full">
                Iniciar Sesión
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="underline">
                Regístrate
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <div className="text-center p-4">
        <Link href="/" className="text-sm text-muted-foreground hover:underline flex items-center justify-center gap-2">
            <ArrowLeft size={14} /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}
