'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@momentum/database';
import Image from 'next/image';
import { useHospitalTheme } from '@/contexts/hospital-theme-context';
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
  X,
  Activity,
  Stethoscope,
  BedDouble,
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  hospitalName: string;
  isOpen?: boolean;
  onClose?: () => void;
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
    label: 'Disease Analytics',
    href: '/disease-analytics',
    icon: TestTube,
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
    label: 'Vitals',
    href: '/vitals',
    icon: Activity,
    roles: ['admin', 'doctor', 'nurse'],
  },
  {
    label: 'Nursing Notes',
    href: '/nursing-notes',
    icon: Stethoscope,
    roles: ['admin', 'nurse'],
  },
  {
    label: 'Admissions',
    href: '/admissions',
    icon: BedDouble,
    roles: ['admin', 'doctor', 'nurse'],
  },
  {
    label: 'Lab Orders',
    href: '/lab-orders',
    icon: TestTube,
    roles: ['admin', 'doctor', 'nurse'],
  },
  {
    label: 'Incoming Orders',
    href: '/lab-orders',
    icon: TestTube,
    roles: ['lab_tech'],
  },
  {
    label: 'Lab Results',
    href: '/lab-results',
    icon: ClipboardList,
    roles: ['lab_tech', 'patient'],
  },
  {
    label: 'Prescriptions',
    href: '/prescriptions',
    icon: ClipboardList,
    roles: ['admin', 'doctor', 'nurse', 'pharmacist', 'patient'],
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

export function Sidebar({ role, hospitalName, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useHospitalTheme();

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));
  
  // Use custom logo if available, otherwise default
  const logoUrl = theme.logoUrl || '/logo.png';
  const appName = role === 'super_admin' ? 'Momentum EMR' : hospitalName;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          w-64 bg-white border-r border-border h-screen flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo & Hospital Name */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                <Image 
                  src={logoUrl} 
                  alt={appName}
                  fill
                  className="object-contain p-1"
                  unoptimized
                  key={logoUrl}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-sm text-primary">{appName}</h2>
                {role === 'super_admin' && (
                  <p className="text-xs text-muted-foreground truncate">Super Admin</p>
                )}
                {role !== 'super_admin' && theme.tagline && (
                  <p className="text-xs text-muted-foreground truncate">{theme.tagline}</p>
                )}
              </div>
            </div>
            {/* Close button (mobile only) */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-spindle rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
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
                    onClick={() => onClose?.()}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:bg-spindle hover:text-primary'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
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
    </>
  );
}

