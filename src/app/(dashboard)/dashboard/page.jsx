/**
 * @fileOverview Archivo neutralizado estructuralmente.
 * Se ha eliminado la exportación por defecto para que Next.js no lo reconozca como una página.
 * Esto resuelve el error "You cannot have two parallel pages that resolve to the same path"
 * permitiendo que la ruta /dashboard se resuelva únicamente en src/app/dashboard/page.jsx.
 */

// Sin export default para evitar colisión de rutas.
const Neutralized = () => null;
