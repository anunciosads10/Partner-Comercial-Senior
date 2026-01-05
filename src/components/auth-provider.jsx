"use client";

import { useUser } from "@/firebase";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const PROTECTED_DASHBOARD_PREFIX = '/';
const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthProvider({ children }) {
  const { user, isUserLoading } = useUser() || {};
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This provider now only handles the simple case:
    // 1. A logged-in user trying to access a public page (login/register).
    // The DashboardLayout handles protecting the dashboard routes.
    
    if (isUserLoading) {
      return; // Do nothing while loading
    }
    
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // If a user is logged in and tries to access a public route (like login/register),
    // redirect them to the main dashboard.
    if (user && isPublicRoute) {
      router.push(PROTECTED_DASHBOARD_PREFIX);
    }
    
    // If there is no user and they are on a protected route, redirect.
    // This is a fallback, but the main protection is in the layout.
    if (!user && !isPublicRoute) {
      router.push('/login');
    }

  }, [user, isUserLoading, router, pathname]);

  // If loading and on a public route, just render the children (e.g., Login form)
  if (isUserLoading && PUBLIC_ROUTES.includes(pathname)) {
    return children;
  }

  // This prevents flashing a protected page's content before redirection.
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
      return null;
  }

  // If checks pass, render the children components.
  return children;
}
