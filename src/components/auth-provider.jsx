"use client";

import { useAuth } from "@/firebase";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const PROTECTED_ROUTES = ['/'];
const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthProvider({ children }) {
  const auth = useAuth();
  const { user, isUserLoading } = auth || {};
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait until the auth state is determined

    const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && isProtectedRoute) {
      // If no user and trying to access a protected route, redirect to login
      router.push('/login');
    }

    if (user && isPublicRoute) {
      // If user is logged in and tries to access login/register, redirect to dashboard
      router.push('/');
    }

  }, [user, isUserLoading, router, pathname]);

  // While checking auth state, you might want to show a loader on protected routes
  if (isUserLoading && PROTECTED_ROUTES.includes(pathname)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }
  
  // If the user is not authenticated and trying to access a protected route,
  // we render null to prevent flashing the protected content.
  // The useEffect above will handle the redirection.
  if (!user && PROTECTED_ROUTES.includes(pathname)) {
    return null;
  }

  // Once sign-in process is complete, render the children
  return children;
}
