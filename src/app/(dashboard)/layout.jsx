'use client';

import React, { useEffect } from "react";
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { Header } from "@/components/header";
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
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [isAuthLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Cargando portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  return (
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
  );
}
