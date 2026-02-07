"use client";

import { useUser } from "@/firebase";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * @typedef {Object} AuthUser
 * @property {string} uid
 * @property {string|null} email
 */

const DASHBOARD_PREFIX = '/dashboard';
const PUBLIC_ROUTES = ['/login', '/register', '/login/forgot-password', '/', '/terms', '/privacy'];

/**
 * Proveedor de autenticación que gestiona la protección de rutas y redirecciones automáticas.
 * Implementado con lógica estricta para evitar estados indeterminados en producción.
 */
export function AuthProvider({ children }) {
  const { user, isUserLoading } = useUser() || { user: null, isUserLoading: true };
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return;
    
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Redirección para usuarios autenticados (Socio o SuperAdmin)
    if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
      router.replace(DASHBOARD_PREFIX);
      return;
    }
    
    // Redirección para visitantes en rutas protegidas
    if (!user && !isPublicRoute) {
      router.replace('/login');
    }

  }, [user, isUserLoading, router, pathname]);

  // Evitar parpadeos de contenido (Flash of Unauthenticated Content)
  if (isUserLoading && !PUBLIC_ROUTES.includes(pathname)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium text-muted-foreground">Verificando acceso...</p>
          </div>
        </div>
      );
  }

  return children;
}
