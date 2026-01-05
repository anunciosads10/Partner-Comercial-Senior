"use client";

import { useAuth } from "@/firebase";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const PROTECTED_DASHBOARD_PREFIX = '/';
const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthProvider({ children }) {
  const { user, isUserLoading } = useAuth() || {};
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until the auth state is determined before running any redirect logic.
    if (isUserLoading) {
      return;
    }

    const isProtectedRoute = !PUBLIC_ROUTES.includes(pathname);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // If there's no user and they're trying to access a protected route, redirect to login.
    if (!user && isProtectedRoute) {
      router.push('/login');
    }

    // If a user is logged in and tries to access a public route (like login/register),
    // redirect them to the main dashboard.
    if (user && isPublicRoute) {
      router.push(PROTECTED_DASHBOARD_PREFIX);
    }
  }, [user, isUserLoading, router, pathname]);

  // While authentication is loading, show a loader for protected routes
  // to prevent flashing the content.
  if (isUserLoading && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If there's no user and they are on a protected route, render nothing.
  // The useEffect above has already triggered the redirection.
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  // If checks pass, render the children components.
  return children;
}
