'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@momentum/database';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Pill,
  DollarSign,
  Bell,
  BarChart3,
  Building2,
  ClipboardList,
  ShoppingCart,
  TestTube,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  hospitalName: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'doctor', 'nurse', 'pharmacist', 'cashier', 'lab_tech', 'patient'],
  },
  // Super Admin specific navigation
  {
    label: 'Super Admin',
    href: '/super-admin',
    icon: LayoutDashboard,
    roles: ['super_admin'],
  },
  {
    label: 'Hospitals',
    href: '/hospitals',
    icon: Building2,
    roles: ['super_admin'],
  },
  {
    label: 'Subscriptions',
    href: '/subscriptions',
    icon: DollarSign,
    roles: ['super_admin'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['super_admin', 'admin', 'doctor'],
  },
  {
    label: 'Users & Staff',
    href: '/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Patients',
    href: '/patients',
    icon: Users,
    roles: ['admin', 'doctor', 'nurse', 'cashier'],
  },
  {
    label: 'Appointments',
    href: '/appointments',
    icon: Calendar,
    roles: ['admin', 'doctor', 'nurse', 'patient'],
  },
  {
    label: 'Medical Records',
    href: '/medical-records',
    icon: FileText,
    roles: ['admin', 'doctor', 'nurse'],
  },
  {
    label: 'Lab Orders',
    href: '/lab-orders',
    icon: TestTube,
    roles: ['admin', 'doctor', 'nurse', 'lab_tech'],
  },
  {
    label: 'Prescriptions',
    href: '/prescriptions',
    icon: ClipboardList,
    roles: ['admin', 'doctor', 'pharmacist', 'patient'],
  },
  {
    label: 'Pharmacy',
    href: '/pharmacy',
    icon: Pill,
    roles: ['admin', 'pharmacist', 'doctor'],
  },
  {
    label: 'Inventory',
    href: '/inventory',
    icon: ShoppingCart,
    roles: ['admin', 'pharmacist'],
  },
  {
    label: 'Billing',
    href: '/billing',
    icon: DollarSign,
    roles: ['admin', 'cashier', 'patient'],
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['super_admin', 'admin', 'doctor', 'nurse', 'pharmacist', 'cashier', 'lab_tech', 'patient'],
  },
  {
    label: 'Surveys',
    href: '/surveys',
    icon: MessageSquare,
    roles: ['admin', 'patient'],
  },
];

export function Sidebar({ role, hospitalName }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-border h-screen sticky top-0 flex flex-col">
      {/* Logo & Hospital Name */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Momentum EMR" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-tory-blue">Momentum EMR</h2>
            <p className="text-xs text-muted-foreground truncate">{hospitalName}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-tory-blue text-white'
                        : 'text-muted-foreground hover:bg-spindle hover:text-tory-blue'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>© 2025 Momentum</p>
        </div>
      </div>
    </aside>
  );
}
