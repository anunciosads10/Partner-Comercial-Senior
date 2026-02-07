/**
 * Layout neutralizado para evitar conflicto de rutas paralelas en Next.js 15.
 * El layout principal está en src/app/dashboard/layout.jsx
 */
// No exportar default para que Next.js ignore esta ruta
export const dynamic = 'force-static';
