'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Textarea } from '@momentum/ui';
import {
  ArrowLeft,
  Pill,
  Plus,
  Minus,
  AlertTriangle,
  Edit,
  Calendar,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

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
  createdAt: string;
  updatedAt: string;
}

export default function InventoryDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const itemId = params.id as string;

  const [showStockForm, setShowStockForm] = useState(false);
  const [stockData, setStockData] = useState({
    type: 'in',
    quantity: '',
    notes: '',
  });

  const { data: item, isLoading, error } = useQuery<InventoryItem>({
    queryKey: ['inventory-item', itemId],
    queryFn: async () => {
      const response = await axios.get(`/api/inventory/${itemId}`);
      return response.data;
    },
  });

  // Adjust stock mutation
  const adjustStock = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`/api/inventory/${itemId}/stock`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Stock adjusted successfully!');
      setShowStockForm(false);
      setStockData({ type: 'in', quantity: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['inventory-item', itemId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    },
  });

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustStock.mutate(stockData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Antibacterial (Antibiotic)': 'bg-green-haze/10 text-green-haze',
      'Antifungal': 'bg-primary/10 text-primary',
      'Antiviral': 'bg-amaranth/10 text-amaranth',
      'Antimalarial': 'bg-danube/10 text-danube',
      'Antidiarrheal': 'bg-saffron/10 text-saffron',
      'Laxative': 'bg-green-haze/10 text-green-haze',
      'Antihypertensive': 'bg-primary/10 text-primary',
      'Anti-diabetic': 'bg-amaranth/10 text-amaranth',
      'Antihistamine': 'bg-danube/10 text-danube',
      'Antitussive': 'bg-saffron/10 text-saffron',
      'Antidepressant': 'bg-green-haze/10 text-green-haze',
      'Sedative/Anxiolytic': 'bg-primary/10 text-primary',
      'NSAIDs': 'bg-amaranth/10 text-amaranth',
      'Statins': 'bg-danube/10 text-danube',
      'Other': 'bg-muted text-muted-foreground',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-ribbon mb-4">Failed to load medication</p>
          <Link href="/inventory">
            <Button variant="outline">Back to Inventory</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalValue = item.quantity * item.unitPrice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{item.drugName}</h1>
            {item.genericName && (
              <p className="text-muted-foreground mt-1">{item.genericName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/inventory/${item.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {item.isExpired && (
          <div className="p-4 bg-red-ribbon/10 border border-red-ribbon/20 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-ribbon flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-ribbon">Medication Expired</p>
              <p className="text-sm text-muted-foreground">
                This medication expired on {formatDate(item.expiryDate)}. Do not dispense.
              </p>
            </div>
          </div>
        )}
        {item.isLowStock && !item.isExpired && (
          <div className="p-4 bg-saffron/10 border border-saffron/20 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-saffron flex-shrink-0" />
            <div>
              <p className="font-semibold text-saffron">Low Stock Alert</p>
              <p className="text-sm text-muted-foreground">
                Stock level ({item.quantity}) is at or below reorder point ({item.reorderLevel}).
                Please restock soon.
              </p>
            </div>
          </div>
        )}
        {item.expiringSoon && !item.isExpired && (
          <div className="p-4 bg-saffron/10 border border-saffron/20 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-saffron flex-shrink-0" />
            <div>
              <p className="font-semibold text-saffron">Expiring Soon</p>
              <p className="text-sm text-muted-foreground">
                This medication will expire in {item.daysToExpiry} days on{' '}
                {formatDate(item.expiryDate)}.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Information */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Stock Information</h2>
              {!showStockForm && (
                <Button variant="primary" size="sm" onClick={() => setShowStockForm(true)}>
                  Adjust Stock
                </Button>
              )}
            </div>

            {/* Stock Adjustment Form */}
            {showStockForm && (
              <form
                onSubmit={handleStockSubmit}
                className="mb-6 p-4 border border-primary/20 bg-primary/5 rounded-lg"
              >
                <h3 className="font-semibold mb-4">Adjust Stock Level</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Action</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={stockData.type === 'in' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setStockData({ ...stockData, type: 'in' })}
                        className="flex-1"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Stock
                      </Button>
                      <Button
                        type="button"
                        variant={stockData.type === 'out' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setStockData({ ...stockData, type: 'out' })}
                        className="flex-1"
                      >
                        <Minus className="w-4 h-4 mr-1" />
                        Remove Stock
                      </Button>
                    </div>
                  </div>
                  <Input
                    label="Quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={stockData.quantity}
                    onChange={(e) => setStockData({ ...stockData, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    required
                  />
                  <div className="md:col-span-2">
                    <Textarea
                      label="Notes (Optional)"
                      value={stockData.notes}
                      onChange={(e) => setStockData({ ...stockData, notes: e.target.value })}
                      rows={2}
                      placeholder="Reason for adjustment, supplier info, etc."
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={adjustStock.isPending}
                  >
                    Apply Adjustment
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStockForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Current Stock Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Stock</p>
                <p className="text-2xl font-bold">{item.quantity}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Reorder Level</p>
                <p className="text-2xl font-bold">{item.reorderLevel}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Unit Price</p>
                <p className="text-lg font-bold">{formatCurrency(item.unitPrice)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                <p className="text-lg font-bold">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </div>

          {/* Medication Details */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-green-haze" />
              Medication Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Drug Name</p>
                <p className="font-medium">{item.drugName}</p>
              </div>
              {item.genericName && (
                <div>
                  <p className="text-sm text-muted-foreground">Generic Name</p>
                  <p className="font-medium">{item.genericName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(item.category)}`}>
                  {item.category}
                </span>
              </div>
              {item.manufacturer && (
                <div>
                  <p className="text-sm text-muted-foreground">Manufacturer</p>
                  <p className="font-medium">{item.manufacturer}</p>
                </div>
              )}
            </div>
          </div>

          {/* Batch Information */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Batch Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Batch Number</p>
                <p className="font-medium">{item.batchNumber || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiry Date</p>
                <p
                  className={`font-medium ${
                    item.isExpired
                      ? 'text-red-ribbon'
                      : item.expiringSoon
                      ? 'text-saffron'
                      : ''
                  }`}
                >
                  {formatDate(item.expiryDate)}
                  {item.daysToExpiry !== null && item.daysToExpiry > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({item.daysToExpiry} days remaining)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span
                  className={`text-sm font-medium ${
                    item.isExpired
                      ? 'text-red-ribbon'
                      : item.isLowStock
                      ? 'text-saffron'
                      : 'text-green-haze'
                  }`}
                >
                  {item.isExpired ? 'Expired' : item.isLowStock ? 'Low Stock' : 'Good'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stock Level</span>
                <span className="text-sm font-medium">
                  {((item.quantity / item.reorderLevel) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Value</span>
                <span className="text-sm font-medium">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

          {/* Record Details */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Record Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Added</p>
                <p className="font-medium">{formatDateTime(item.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDateTime(item.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
