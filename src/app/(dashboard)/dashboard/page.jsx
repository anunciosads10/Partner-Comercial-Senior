/**
 * @fileOverview Archivo desactivado físicamente para resolver el conflicto de rutas paralelas en Next.js 15.
 * La página activa del dashboard se encuentra en /src/app/dashboard/page.jsx.
 * Al eliminar la exportación por defecto, Next.js deja de considerar este archivo como una ruta de página.
 */
export const dynamic = 'force-static';
// Se elimina la exportación por defecto para evitar colisión de rutas con /src/app/dashboard/page.jsx
