/**
 * Archivo neutralizado para evitar conflicto de rutas paralelas en Next.js 15.
 * La ruta principal y activa es src/app/dashboard/page.jsx.
 * No debe exportar un componente por defecto para que Next.js no lo registre como página.
 */
export default function Page() {
  return null;
}
