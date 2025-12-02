'use client';

import { useSession } from 'next-auth/react';
import { Package, TestTube, Pill, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function InventoryHubPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Determine which inventories the user can access
  const userRole = session?.user?.role;
  
  const inventoryTypes = [
    {
      id: 'pharmacy',
      title: 'Pharmacy Inventory',
      description: 'Manage medications, drugs, and pharmaceutical supplies',
      icon: Pill,
      path: '/inventory/pharmacy',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
      roles: ['admin', 'pharmacist'],
    },
    {
      id: 'nursing',
      title: 'Nursing Supplies',
      description: 'Manage nursing supplies, consumables, and medical equipment',
      icon: Package,
      path: '/nursing/supplies',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      roles: ['admin', 'nurse'],
    },
    {
      id: 'lab',
      title: 'Laboratory Supplies',
      description: 'Manage lab reagents, test kits, and laboratory consumables',
      icon: TestTube,
      path: '/lab/supplies',
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      roles: ['admin', 'lab_scientist'],
    },
  ];

  // Filter based on user role
  const accessibleInventories = inventoryTypes.filter(inventory =>
    inventory.roles.includes(userRole || '')
  );

  // If user has only one inventory, redirect directly
  useEffect(() => {
    if (accessibleInventories.length === 1) {
      router.push(accessibleInventories[0].path);
    }
  }, [accessibleInventories, router]);

  if (accessibleInventories.length === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground mt-1">
          Select an inventory type to manage
        </p>
      </div>

      {/* Role Badge */}
      {userRole === 'admin' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Administrator Access</p>
              <p className="text-sm text-amber-700">
                You have access to all inventory types
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accessibleInventories.map((inventory) => {
          const IconComponent = inventory.icon;
          
          return (
            <Link key={inventory.id} href={inventory.path}>
              <div className={`group relative border-2 rounded-lg p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer ${inventory.color}`}>
                {/* Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-white flex items-center justify-center ${inventory.iconColor}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <ArrowRight className={`w-5 h-5 ${inventory.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>

                {/* Content */}
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {inventory.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {inventory.description}
                </p>

                {/* Role Badge */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {inventory.roles.map((role) => (
                    <span
                      key={role}
                      className="text-xs px-2 py-1 rounded bg-white/50 text-gray-700"
                    >
                      {role.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* No Access Message */}
      {accessibleInventories.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            No Inventory Access
          </h3>
          <p className="text-red-700">
            You don't have permission to access any inventory types. Please contact your administrator.
          </p>
        </div>
      )}
    </div>
  );
}
