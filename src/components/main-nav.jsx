'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Percent,
  GitFork,
  CreditCard,
  Gavel,
  Bell,
  Settings,
  Puzzle,
  BarChart3,
} from 'lucide-react';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const allMenuItems = [
  { href: '/dashboard', label: 'Panel Principal', icon: LayoutDashboard, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/partners', label: 'Partners', icon: Users, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/platforms', label: 'Plataformas SaaS', icon: Puzzle, roles: ['superadmin'] },
  { href: '/dashboard/commissions', label: 'Comisiones', icon: Percent, roles: ['superadmin'] },
  { href: '/dashboard/hierarchy', label: 'Jerarquía', icon: GitFork, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/payments', label: 'Pagos', icon: CreditCard, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/reports', label: 'Reportes', icon: BarChart3, roles: ['superadmin'] },
  { href: '/dashboard/rules', label: 'Reglas', icon: Gavel, roles: ['superadmin'] },
  { href: '/dashboard/notifications', label: 'Notificaciones', icon: Bell, roles: ['admin', 'superadmin'] },
];

export function MainNav({ userData }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const userRole = userData?.role || 'admin';

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <svg
            className="w-8 h-8 text-sidebar-primary-foreground"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 7L12 12L22 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 12V22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className={cn(
              'text-lg font-semibold text-sidebar-primary-foreground',
              state === 'collapsed' && 'hidden'
            )}
          >
            PartnerVerse
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 mt-auto">
        <SidebarMenu>
           <SidebarMenuItem>
            <Link href="/dashboard/settings">
              <SidebarMenuButton
                isActive={pathname.startsWith('/dashboard/settings')}
                tooltip="Configuración"
              >
                <Settings />
                <span>Configuración</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}