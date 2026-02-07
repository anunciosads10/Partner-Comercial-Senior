'use client';

import { AuthenticatedLayout } from '@/components/authenticated-layout';

export default function DashboardLayout({ children }) {
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  );
}
