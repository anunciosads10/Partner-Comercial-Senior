'use client';

import React, { useEffect } from "react";
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { Header } from "@/components/header";
import { AuthProvider } from "@/components/auth-provider";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userDocRef);

  const isLoading = isAuthLoading || (user && isRoleLoading);

  useEffect(() => {
    // If loading is finished and there's no authenticated user, redirect to login.
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // While loading auth state or user role, show a full-screen loader.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando portal...</p>
      </div>
    );
  }

  // If loading is done, but we still have no user, render nothing.
  // The useEffect above will handle the redirection.
  if (!user) {
    return null;
  }
  
  return (
    <AuthProvider>
      <SidebarProvider>
        <Sidebar>
          <MainNav userData={userData} />
        </Sidebar>
        <SidebarInset>
          <Header userData={userData} />
          <main className="p-4 sm:p-6 lg:p-8">
            {React.cloneElement(children, { userData })}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
