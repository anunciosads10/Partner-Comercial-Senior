// src/app/(dashboard)/layout.jsx
/**
 * @fileOverview Server Component que actúa como wrapper para el layout autenticado.
 * Esta separación es necesaria en Next.js 15 para evitar errores de manifiesto 
 * cuando conviven layouts de cliente y páginas de servidor.
 */

import { AuthenticatedLayout } from '@/components/authenticated-layout';

export default function DashboardLayout({ children }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}