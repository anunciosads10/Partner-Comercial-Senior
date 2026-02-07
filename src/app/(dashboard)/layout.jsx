/**
 * Layout neutralizado para evitar conflicto de rutas paralelas en Next.js 15.
 * El layout principal está en src/app/dashboard/layout.jsx
 */
export default function InactiveLayout({ children }) {
  return <>{children}</>;
}
