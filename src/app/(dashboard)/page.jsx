'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRoot() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir la raíz del grupo (dashboard) a la sub-página real para evitar conflictos con la landing page real
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Redirigiendo al panel...</p>
    </div>
  );
}
