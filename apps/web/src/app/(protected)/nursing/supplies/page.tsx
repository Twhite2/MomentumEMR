'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

export default function NursingSuppliesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch nursing supplies (inventory with category="Nursing")
  const { data: supplies, isLoading } = useQuery({
    queryKey: ['nursing-supplies', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: 'Nursing',
        limit: '100',
      });
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const response = await axios.get(`/api/inventory?${params}`);
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nursing Supplies</h1>
          <p className="text-muted-foreground mt-1">
            Manage nursing inventory and track patient usage
          </p>
        </div>
        <Link href="/nursing/supplies/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Supply
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{supplies?.inventory?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">
                {supplies?.inventory?.filter((s: any) => s.stockQuantity <= s.reorderLevel).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search supplies by name..."
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
                Supply Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Unit Price
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
            ) : supplies?.inventory?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No nursing supplies found. Add your first supply!
                </td>
              </tr>
            ) : (
              supplies?.inventory?.map((supply: any) => {
                const isLowStock = supply.stockQuantity <= supply.reorderLevel;
                
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
                      <div>
                        <p className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {supply.stockQuantity} units
                        </p>
                        {supply.tabletsPerPackage > 1 && (
                          <p className="text-xs text-gray-500">
                            ({supply.stockQuantity * supply.tabletsPerPackage} total items)
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ₦{parseFloat(supply.unitPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {isLowStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Link href={`/nursing/supplies/${supply.id}/record-usage`}>
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
