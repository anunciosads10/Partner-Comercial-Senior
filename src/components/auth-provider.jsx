"use client";

import { useUser } from "@/firebase";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const DASHBOARD_PREFIX = '/dashboard';
const PUBLIC_ROUTES = ['/login', '/register', '/login/forgot-password', '/'];

export function AuthProvider({ children }) {
  const { user, isUserLoading } = useUser() || {};
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return;
    }
    
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isProtectedRoute = !isPublicRoute;

    // Si el usuario está logueado e intenta acceder a rutas públicas de auth o al inicio, llevarlo al dashboard
    if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
      router.push(DASHBOARD_PREFIX);
    }
    
    // Si no hay usuario y está en una ruta protegida, llevar a login
    if (!user && isProtectedRoute) {
      router.push('/login');
    }

  }, [user, isUserLoading, router, pathname]);

  // Mostrar cargador solo si es una ruta protegida y estamos cargando
  if (isUserLoading && !PUBLIC_ROUTES.includes(pathname)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p>Verificando acceso...</p>
        </div>
      );
  }

  // No renderizar nada si no hay usuario en ruta protegida (el useEffect redirigirá)
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
      return null;
  }

  return children;
}