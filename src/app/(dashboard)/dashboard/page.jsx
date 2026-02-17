/**
 * Este archivo ha sido desactivado para resolver el error de "Parallel Pages" en Next.js 15.
 * Next.js 15 no permite dos páginas que resuelvan a la misma ruta (/(dashboard)/dashboard y /dashboard).
 * El punto de entrada principal del dashboard es src/app/dashboard/page.jsx.
 */

// Se ha eliminado el export default para que Next.js ignore este archivo como una página.
export const dynamic = 'force-static';
