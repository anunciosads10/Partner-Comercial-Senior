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
      return; // Do nothing while loading
    }
    
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isDashboardRoute = pathname.startsWith(DASHBOARD_PREFIX);

    // If user is logged in and tries to access a public route, redirect to dashboard
    if (user && isPublicRoute && pathname !== '/') {
      router.push(DASHBOARD_PREFIX);
    }
    
    // If there is no user and they are on a protected dashboard route, redirect to login
    if (!user && isDashboardRoute) {
      router.push('/login');
    }

  }, [user, isUserLoading, router, pathname]);

  // If loading on a protected route, show a loader or nothing
  if (isUserLoading && !PUBLIC_ROUTES.includes(pathname)) {
      // You could return a full-page loader here
      return null;
  }

  // Prevent flashing protected content before redirection
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
      return null;
  }

  // Render children if checks pass
  return children;
}