"use client";

import { useUser } from "@/firebase";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const DASHBOARD_PREFIX = '/dashboard';
const PUBLIC_ROUTES = ['/login', '/register', '/login/forgot-password', '/', '/terms', '/privacy'];

export function AuthProvider({ children }) {
  const { user, isUserLoading } = useUser() || {};
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return;
    
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isProtectedRoute = !isPublicRoute && !pathname.startsWith('/(dashboard)');

    // Redirección automática si ya está logueado:
    // Si el usuario ya inició sesión e intenta ir a Login, Registro o Inicio, lo mandamos al Dashboard
    if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
      router.replace(DASHBOARD_PREFIX);
    }
    
    // Si no hay usuario y trata de entrar a una ruta que no es pública
    if (!user && !isPublicRoute) {
      router.replace('/login');
    }

  }, [user, isUserLoading, router, pathname]);

  // Evitar parpadeos de contenido protegido mientras carga
  if (isUserLoading && !PUBLIC_ROUTES.includes(pathname)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      );
  }

  return children;
}
