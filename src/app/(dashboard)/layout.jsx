'use client';

import React, { useEffect } from "react";
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { Header } from "@/components/header";
import { AuthProvider } from "@/components/auth-provider";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isRoleLoading } = useDoc(userDocRef);

  const isLoading = isAuthLoading || (user && isRoleLoading);

  useEffect(() => {
    // Protección adicional: si no hay usuario, redirigir a login
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [isAuthLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando portal...</p>
      </div>
    );
  }

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
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}