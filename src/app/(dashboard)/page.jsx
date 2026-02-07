import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirección raíz del panel para evitar conflictos de rutas con la landing page.
 * Implementado como Server Component (sin 'use client') para resolver el error de compilación 
 * ENOENT: page_client-reference-manifest.js en Vercel/Next.js 15.
 */
export default function DashboardRootRedirect() {
  // Redirección a nivel de servidor hacia el panel principal
  redirect('/dashboard');
}