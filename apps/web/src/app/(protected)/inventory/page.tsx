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
  drugName: string;
  genericName: string | null;
  category: string;
  quantity: number;
  unitPrice: number;
  reorderLevel: number;
  expiryDate: string | null;
  batchNumber: string | null;
  manufacturer: string | null;
  isExpired: boolean;
  isLowStock: boolean;
  daysToExpiry: number | null;
  expiringSoon: boolean;
}

interface InventoryResponse {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'lowStock' | 'expired'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<InventoryResponse>({
    queryKey: ['inventory', searchQuery, filter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (searchQuery) params.append('search', searchQuery);
      if (filter === 'lowStock') params.append('lowStock', 'true');
      if (filter === 'expired') params.append('expired', 'true');

      const response = await axios.get(`/api/inventory?${params}`);
      return response.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Antibacterial (Antibiotic)': 'bg-green-haze/10 text-green-haze',
      'Antifungal': 'bg-tory-blue/10 text-tory-blue',
      'Antiviral': 'bg-amaranth/10 text-amaranth',
      'Antimalarial': 'bg-danube/10 text-danube',
      'Antidiarrheal': 'bg-saffron/10 text-saffron',
      'Laxative': 'bg-green-haze/10 text-green-haze',
      'Antihypertensive': 'bg-tory-blue/10 text-tory-blue',
      'Anti-diabetic': 'bg-amaranth/10 text-amaranth',
      'Antihistamine': 'bg-danube/10 text-danube',
      'Antitussive': 'bg-saffron/10 text-saffron',
      'Antidepressant': 'bg-green-haze/10 text-green-haze',
      'Sedative/Anxiolytic': 'bg-tory-blue/10 text-tory-blue',
      'NSAIDs': 'bg-amaranth/10 text-amaranth',
      'Statins': 'bg-danube/10 text-danube',
      'Other': 'bg-muted text-muted-foreground',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate stats
  const stats = data
    ? {
        total: data.items.length,
        lowStock: data.items.filter((item) => item.isLowStock).length,
        expired: data.items.filter((item) => item.isExpired).length,
        expiringSoon: data.items.filter((item) => item.expiringSoon).length,
      }
    : null;

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
          <Button variant="primary" size="md">
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
        queryKey={['inventory']}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{data?.pagination.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Low Stock</p>
            <p className="text-2xl font-bold text-saffron">{stats.lowStock}</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Expired</p>
            <p className="text-2xl font-bold text-red-ribbon">{stats.expired}</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Expiring Soon</p>
            <p className="text-2xl font-bold text-saffron">{stats.expiringSoon}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by drug name or generic name..."
                className="pl-10"
              />
            </div>
          </form>

          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="md"
              onClick={() => {
                setFilter('all');
                setPage(1);
              }}
            >
              All
            </Button>
            <Button
              variant={filter === 'lowStock' ? 'primary' : 'outline'}
              size="md"
              onClick={() => {
                setFilter('lowStock');
                setPage(1);
              }}
            >
              Low Stock
            </Button>
            <Button
              variant={filter === 'expired' ? 'primary' : 'outline'}
              size="md"
              onClick={() => {
                setFilter('expired');
                setPage(1);
              }}
            >
              Expired
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading inventory...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load inventory</p>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 text-center">
            <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No medications found</p>
            <Link href="/inventory/new">
              <Button variant="primary" size="sm" className="mt-4">
                Add First Medication
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium">Drug Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Category</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Stock</th>
                    <th className="text-right py-3 px-4 text-sm font-medium">Unit Price</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Expiry Date</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{item.drugName}</p>
                          {item.genericName && (
                            <p className="text-sm text-muted-foreground">{item.genericName}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            item.isLowStock ? 'text-red-ribbon' : 'text-foreground'
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {' '}
                          / {item.reorderLevel}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={
                            item.isExpired
                              ? 'text-red-ribbon font-semibold'
                              : item.expiringSoon
                              ? 'text-saffron font-semibold'
                              : 'text-muted-foreground'
                          }
                        >
                          {formatDate(item.expiryDate)}
                        </span>
                        {item.daysToExpiry !== null && item.daysToExpiry > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.daysToExpiry} days
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          {item.isExpired && (
                            <span className="flex items-center gap-1 text-xs text-red-ribbon">
                              <AlertTriangle className="w-3 h-3" />
                              Expired
                            </span>
                          )}
                          {item.isLowStock && !item.isExpired && (
                            <span className="flex items-center gap-1 text-xs text-saffron">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          )}
                          {item.expiringSoon && !item.isExpired && (
                            <span className="text-xs text-saffron">Expiring Soon</span>
                          )}
                          {!item.isExpired && !item.isLowStock && !item.expiringSoon && (
                            <span className="text-xs text-green-haze">✓ Good</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Link href={`/inventory/${item.id}`}>
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to{' '}
                  {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}{' '}
                  items
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

