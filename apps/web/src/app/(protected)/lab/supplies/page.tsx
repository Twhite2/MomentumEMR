'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import { Plus, Search, TestTube, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

export default function LabSuppliesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const filterParam = searchParams.get('filter'); // 'low-stock' or 'expiring'

  // Fetch lab supplies (inventory with category="Lab")
  const { data: supplies, isLoading } = useQuery({
    queryKey: ['lab-supplies', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: 'Lab',
        limit: '100',
      });
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const response = await axios.get(`/api/inventory?${params}`);
      return response.data;
    },
  });

  // Filter supplies based on URL parameter
  const getFilteredSupplies = () => {
    let items = supplies?.inventory || [];
    
    if (filterParam === 'low-stock') {
      items = items.filter((s: any) => s.stockQuantity <= s.reorderLevel);
    } else if (filterParam === 'expiring') {
      const today = new Date();
      const ninetyDaysFromNow = new Date(today);
      ninetyDaysFromNow.setDate(today.getDate() + 90);
      items = items.filter((s: any) => {
        if (!s.expiryDate) return false;
        const expiryDate = new Date(s.expiryDate);
        return expiryDate <= ninetyDaysFromNow && expiryDate > today;
      });
    }
    
    return items;
  };

  const filteredSupplies = getFilteredSupplies();

  const clearFilter = () => {
    router.push('/lab/supplies');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laboratory Supplies</h1>
          <p className="text-muted-foreground mt-1">
            Manage lab inventory, reagents, and test kits
          </p>
        </div>
        <Link href="/lab/supplies/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Supply
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <TestTube className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{supplies?.inventory?.length || 0}</p>
            </div>
          </div>
        </div>
        <Link href="/lab/supplies?filter=low-stock">
          <div className="bg-white rounded-lg border-2 border-red-500 p-4 hover:border-red-600 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {supplies?.inventory?.filter((s: any) => s.stockQuantity <= s.reorderLevel).length || 0}
                </p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/lab/supplies?filter=expiring">
          <div className="bg-white rounded-lg border-2 border-amber-500 p-4 hover:border-amber-600 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon (90 days)</p>
                <p className="text-2xl font-bold text-amber-600">
                  {supplies?.inventory?.filter((s: any) => {
                    if (!s.expiryDate) return false;
                    const today = new Date();
                    const ninetyDaysFromNow = new Date(today);
                    ninetyDaysFromNow.setDate(today.getDate() + 90);
                    const expiryDate = new Date(s.expiryDate);
                    return expiryDate <= ninetyDaysFromNow && expiryDate > today;
                  }).length || 0}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Active Filter Badge */}
      {filterParam && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filter:</span>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {filterParam === 'low-stock' ? 'Low Stock Items' : 'Expiring Soon (90 days)'}
            <button onClick={clearFilter} className="hover:bg-primary/20 rounded-full p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search reagents, test kits, consumables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Supplies List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Item Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expiry Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading supplies...
                </td>
              </tr>
            ) : filteredSupplies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {filterParam 
                    ? `No ${filterParam === 'low-stock' ? 'low stock' : 'expiring'} supplies found.`
                    : 'No lab supplies found. Add your first supply!'}
                </td>
              </tr>
            ) : (
              filteredSupplies.map((supply: any) => {
                const isLowStock = supply.stockQuantity <= supply.reorderLevel;
                // Check if expiring within 90 days (matching dashboard calculation)
                const today = new Date();
                const ninetyDaysFromNow = new Date(today);
                ninetyDaysFromNow.setDate(today.getDate() + 90);
                const isExpiringSoon = supply.expiryDate && 
                  new Date(supply.expiryDate) <= ninetyDaysFromNow &&
                  new Date(supply.expiryDate) > today;
                
                return (
                  <tr key={supply.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{supply.itemName}</p>
                        {supply.drugCategory && (
                          <p className="text-sm text-gray-500">{supply.drugCategory}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {supply.packagingUnit || 'Unit'}
                    </td>
                    <td className="px-6 py-4">
                      <p className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {supply.stockQuantity} units
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {supply.expiryDate ? (
                        <span className={isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                          {new Date(supply.expiryDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isLowStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Expiring Soon
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Link href={`/lab/supplies/${supply.id}/record-usage`}>
                          <Button variant="outline" size="sm">
                            Record Usage
                          </Button>
                        </Link>
                        <Link href={`/inventory/${supply.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
