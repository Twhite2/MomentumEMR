'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import { Plus, Pill, AlertTriangle, Search } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import ExcelImportExport from '@/components/shared/ExcelImportExport';

interface InventoryItem {
  id: number;
  itemName: string;
  category: string;
  drugCategory: string | null;
  dosageForm: string | null;
  dosageStrength: string | null;
  stockQuantity: number;
  packagingUnit: string | null;
  tabletsPerPackage: number | null;
  unitPrice: number;
  corporatePrice: number | null;
  reorderLevel: number;
  expiryDate: string | null;
}

export default function PharmacyInventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'expired'>('all');

  // Fetch pharmacy inventory (category="Medication")
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['pharmacy-inventory', searchQuery, filter],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: 'Medication',
        limit: '100',
      });
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (filter === 'low_stock') {
        params.append('lowStock', 'true');
      }
      if (filter === 'expired') {
        params.append('expired', 'true');
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
          <h1 className="text-3xl font-bold">Pharmacy Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage medication stock and track expiry dates
          </p>
        </div>
        <Link href="/inventory/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        </Link>
      </div>

      {/* Excel Import/Export */}
      <ExcelImportExport
        title="Bulk Inventory Import"
        description="Download Excel template, fill offline, and upload for batch inventory creation"
        templateEndpoint="/api/inventory/excel/template"
        importEndpoint="/api/inventory/excel/import"
        templateFilename="Inventory_Template"
        queryKey={['pharmacy-inventory']}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold">{inventory?.inventory?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">
            {inventory?.inventory?.filter((i: any) => i.stockQuantity <= i.reorderLevel).length || 0}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search medications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'low_stock' ? 'primary' : 'outline'}
              onClick={() => setFilter('low_stock')}
            >
              Low Stock
            </Button>
            <Button
              variant={filter === 'expired' ? 'primary' : 'outline'}
              onClick={() => setFilter('expired')}
            >
              Expired
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Drug Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Dosage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
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
                  Loading inventory...
                </td>
              </tr>
            ) : inventory?.inventory?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No medications found
                </td>
              </tr>
            ) : (
              inventory?.inventory?.map((item: any) => {
                const isLowStock = item.stockQuantity <= item.reorderLevel;
                const totalTablets = item.stockQuantity * (item.tabletsPerPackage || 1);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.itemName}</p>
                        {item.drugCategory && (
                          <p className="text-sm text-gray-500">{item.drugCategory}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.dosageStrength && item.dosageForm ? (
                        <div>
                          <p className="text-gray-900">{item.dosageStrength}</p>
                          <p className="text-gray-500">{item.dosageForm}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.stockQuantity} {item.packagingUnit || 'units'}
                        </p>
                        {item.tabletsPerPackage > 1 && (
                          <p className="text-xs text-gray-500">
                            ({totalTablets} total tablets)
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">₦{parseFloat(item.unitPrice || 0).toLocaleString()}</p>
                        {item.corporatePrice && (
                          <p className="text-gray-500">Corp: ₦{parseFloat(item.corporatePrice).toLocaleString()}</p>
                        )}
                      </div>
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
                      <Link href={`/inventory/${item.id}`}>
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </Link>
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
