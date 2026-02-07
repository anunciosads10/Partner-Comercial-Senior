/**
 * Archivo neutralizado para evitar conflicto de rutas paralelas en Next.js 15.
 * La ruta principal está en src/app/dashboard/page.jsx
 */
// No exportar default para que Next.js ignore esta ruta
export const dynamic = 'force-static';
