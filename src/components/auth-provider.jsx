"use client";

import { useUser } from "@/firebase";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const DASHBOARD_PREFIX = '/dashboard';
const PUBLIC_ROUTES = ['/login', '/register', '/login/forgot-password', '/', '/terms', '/privacy'];

/**
 * @fileOverview Proveedor de autenticación global.
 * Gestiona redirecciones inteligentes y protege la ruta /dashboard.
 */
export function AuthProvider({ children }) {
  const { user, isUserLoading } = useUser() || { user: null, isUserLoading: true };
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return;
    
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Si el usuario está logueado e intenta ir a rutas de acceso, lo mandamos al dashboard
    if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
      router.replace(DASHBOARD_PREFIX);
      return;
    }
    
    // Si no hay sesión y la ruta es protegida (empieza por /dashboard), al login
    if (!user && pathname.startsWith(DASHBOARD_PREFIX)) {
      router.replace('/login');
    }

  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading && pathname.startsWith(DASHBOARD_PREFIX)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium text-muted-foreground">Validando sesión...</p>
          </div>
        </div>
      );
  }

  return children;
}
