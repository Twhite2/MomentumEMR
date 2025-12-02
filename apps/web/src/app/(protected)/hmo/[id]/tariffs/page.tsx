'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import { Upload, Search, Trash2, Download, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/shared/BackButton';
import axios from 'axios';
import { toast } from 'sonner';

export default function HmoTariffsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [hmoType, setHmoType] = useState('reliance');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');

  // Fetch HMO details
  const { data: hmo } = useQuery({
    queryKey: ['hmo', id],
    queryFn: async () => {
      const response = await axios.get(`/api/hmo/${id}`);
      return response.data;
    },
  });

  // Fetch tariffs
  const { data: tariffsData, isLoading } = useQuery({
    queryKey: ['hmo-tariffs', id, searchTerm, category],
    queryFn: async () => {
      const response = await axios.get(`/api/hmo/${id}/tariffs`, {
        params: { search: searchTerm, category, limit: 50 },
      });
      return response.data;
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('hmoType', hmoType);

      const response = await axios.post(`/api/hmo/${id}/tariffs/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Imported ${data.success} tariffs successfully`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} tariffs failed to import`);
      }
      queryClient.invalidateQueries({ queryKey: ['hmo-tariffs', id] });
      setFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to import tariffs');
    },
  });

  // Clear all tariffs
  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`/api/hmo/${id}/tariffs`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Deleted ${data.count} tariffs`);
      queryClient.invalidateQueries({ queryKey: ['hmo-tariffs', id] });
    },
    onError: () => {
      toast.error('Failed to clear tariffs');
    },
  });

  const handleImport = () => {
    importMutation.mutate();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all tariffs for this HMO? This action cannot be undone.')) {
      clearMutation.mutate();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <FileText className="w-8 h-8" />
            HMO Tariff Management
          </h1>
          <p className="text-muted-foreground mt-1">
            {hmo?.name || 'Loading...'} - Import and manage pricing tariffs
          </p>
        </div>
        <BackButton />
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Tariffs from Excel
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">HMO Type *</label>
            <select
              value={hmoType}
              onChange={(e) => setHmoType(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue"
            >
              <option value="reliance">Reliance HMO (Tiered Drug Pricing)</option>
              <option value="leadway">Leadway Provider Network (Procedure Codes)</option>
              <option value="axa">AXA Mansard (Service Packages)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Select the format that matches your Excel file
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excel File *</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {file ? file.name : 'No file selected'}
            </p>
          </div>
        </div>

        {/* Format Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Expected Format for {hmoType === 'reliance' ? 'Reliance HMO' : hmoType === 'leadway' ? 'Leadway' : 'AXA Mansard'}
          </h4>
          <div className="text-xs text-blue-800 space-y-1">
            {hmoType === 'reliance' && (
              <>
                <p><strong>Columns:</strong> S/N | LINE ITEM | Unit | Tier 4 | Tier 3 | Tier 2 | Tier 1 | Tier 0</p>
                <p><strong>Example:</strong> 1 | PARACETAMOL TABLET | Tab/500mg | ₦100 | ₦120 | ₦150 | ₦180 | ₦200</p>
              </>
            )}
            {hmoType === 'leadway' && (
              <>
                <p><strong>Columns:</strong> Proceedure Code | Proceedure Name | Amount</p>
                <p><strong>Example:</strong> 10100001 | BLADDER IRRIGATION | ₦4,000.00</p>
              </>
            )}
            {hmoType === 'axa' && (
              <>
                <p><strong>Columns:</strong> Code | Name | Category | IsPARequired | Tariff | EffectiveDate</p>
                <p><strong>Example:</strong> Pack0001 | Annual Check Up | Wellness | TRUE | ₦35,000 | Nov 27, 2023</p>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={!file || importMutation.isPending}
            loading={importMutation.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            {importMutation.isPending ? 'Importing...' : 'Import Tariffs'}
          </Button>

          {tariffsData?.pagination?.total > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={clearMutation.isPending}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Tariffs
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Tariffs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search by Name or Code</label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., Paracetamol, 10100001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter by Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue"
            >
              <option value="">All Categories</option>
              <option value="Medication">Medication</option>
              <option value="Procedure">Procedure</option>
              <option value="Package">Package</option>
              <option value="Health Check and wellness">Health Check and Wellness</option>
            </select>
          </div>
        </div>

        {tariffsData?.pagination && (
          <p className="text-sm text-muted-foreground mt-4">
            Showing {tariffsData.tariffs.length} of {tariffsData.pagination.total} tariffs
          </p>
        )}
      </div>

      {/* Tariffs List */}
      <div className="bg-white rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  PA Required
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Loading tariffs...
                  </td>
                </tr>
              ) : tariffsData?.tariffs?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No tariffs found. Import an Excel file to get started.
                  </td>
                </tr>
              ) : (
                tariffsData?.tariffs?.map((tariff: any) => (
                  <tr key={tariff.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {tariff.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {tariff.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {tariff.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {tariff.unit || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <div>
                        <span className="font-medium">{formatPrice(parseFloat(tariff.basePrice))}</span>
                        {tariff.tier0Price && (
                          <div className="text-xs text-muted-foreground mt-1">
                            T0: {formatPrice(parseFloat(tariff.tier0Price))} |
                            T1: {formatPrice(parseFloat(tariff.tier1Price || 0))} |
                            T2: {formatPrice(parseFloat(tariff.tier2Price || 0))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {tariff.isPARequired ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
