'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import { Search, FileSpreadsheet, Download, Upload, Filter } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface HMO {
  id: number;
  name: string;
  providerCode: string;
  active: boolean;
  _count: {
    tariffs: number;
  };
}

export default function AllHMOTariffsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHMO, setSelectedHMO] = useState<string>('all');

  // Fetch all HMOs
  const { data: hmos, isLoading: hmosLoading } = useQuery<HMO[]>({
    queryKey: ['hmos-with-tariffs'],
    queryFn: async () => {
      const response = await axios.get('/api/hmo?includeTariffCount=true');
      return response.data;
    },
  });

  const filteredHMOs = hmos?.filter(hmo => {
    if (selectedHMO !== 'all' && hmo.id.toString() !== selectedHMO) return false;
    if (searchQuery && !hmo.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HMO Tariff Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage tariff data for all HMO providers
          </p>
        </div>
        <Button variant="primary" size="md">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search HMO Provider</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by HMO name..."
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter by HMO</label>
            <select
              value={selectedHMO}
              onChange={(e) => setSelectedHMO(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue"
            >
              <option value="all">All HMOs</option>
              {hmos?.map((hmo) => (
                <option key={hmo.id} value={hmo.id.toString()}>
                  {hmo.name} ({hmo._count.tariffs} tariffs)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* HMO Cards */}
      {hmosLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tory-blue mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading HMO providers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHMOs?.map((hmo) => (
            <div
              key={hmo.id}
              className="bg-white rounded-lg border border-border hover:border-tory-blue transition-all hover:shadow-md p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {hmo.name}
                  </h3>
                  {hmo.providerCode && (
                    <p className="text-sm text-muted-foreground">
                      Code: {hmo.providerCode}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  hmo.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {hmo.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Stats */}
              <div className="bg-tory-blue/5 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-tory-blue" />
                    <span className="text-sm text-muted-foreground">Tariff Items</span>
                  </div>
                  <span className="text-2xl font-bold text-tory-blue">
                    {hmo._count.tariffs.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Link href={`/hmo/${hmo.id}/tariffs`} className="block">
                  <Button variant="primary" size="sm" className="w-full">
                    <Search className="w-4 h-4 mr-2" />
                    View & Search Tariffs
                  </Button>
                </Link>
                <Link href={`/hmo/${hmo.id}/tariffs`} className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Data
                  </Button>
                </Link>
                <Link href={`/hmo/${hmo.id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Manage HMO
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredHMOs?.length === 0 && !hmosLoading && (
        <div className="text-center py-12 bg-white rounded-lg border border-border">
          <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">No HMO providers found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Quick Upload Section */}
      <div className="bg-gradient-to-r from-tory-blue/5 to-spindle rounded-lg border-2 border-dashed border-tory-blue/30 p-8">
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto text-tory-blue mb-4" />
          <h3 className="text-xl font-semibold mb-2">Quick Upload Tariff Data</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Select an HMO provider above and click "Upload New Data" to import Excel/CSV files 
            with tariff information. Supported formats: AXA Mansard, Leadway, and Reliance HMO templates.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/templates/hmo-tariff-template.xlsx"
              download
              className="inline-block"
            >
              <Button variant="outline" size="md">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">How to Import Tariff Data</h3>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-tory-blue text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>Select the HMO provider you want to update from the list above</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-tory-blue text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>Click "Upload New Data" to access the tariff management page</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-tory-blue text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Choose your Excel/CSV file and select the correct HMO type (AXA, Leadway, or Reliance)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-tory-blue text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span>Click Import to upload the tariff data. The system will automatically parse and validate the data</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
