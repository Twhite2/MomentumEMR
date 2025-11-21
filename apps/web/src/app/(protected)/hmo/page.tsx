'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input, Select } from '@momentum/ui';
import { Plus, Building2, FileText, Settings, DollarSign, ChevronRight, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface HMO {
  id: number;
  name: string;
  providerCode: string;
  submissionMethod: string;
  requiresAuthorization: boolean;
  active: boolean;
  _count: {
    patients: number;
    encounters: number;
  };
}

export default function HMOManagementPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    providerCode: '',
    submissionMethod: 'email_pdf',
    requiredFormat: 'PDF',
    submissionEmail: '',
    codingStandard: 'icd10',
    requiresAuthorization: true,
  });

  // Fetch HMOs
  const { data: hmos, isLoading } = useQuery<HMO[]>({
    queryKey: ['hmos'],
    queryFn: async () => {
      const response = await axios.get('/api/hmo?includeInactive=true');
      return response.data;
    },
  });

  // Create HMO mutation
  const createHMO = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/hmo', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('HMO created successfully');
      queryClient.invalidateQueries({ queryKey: ['hmos'] });
      setShowCreateModal(false);
      setFormData({
        name: '',
        providerCode: '',
        submissionMethod: 'email_pdf',
        requiredFormat: 'PDF',
        submissionEmail: '',
        codingStandard: 'icd10',
        requiresAuthorization: true,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create HMO');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createHMO.mutate(formData);
  };

  const hasAccess = ['admin', 'cashier'].includes(session?.user?.role || '');
  const isAdmin = session?.user?.role === 'admin';

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            HMO Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage HMO providers and claims configurations
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add HMO
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active HMOs</p>
              <p className="text-2xl font-bold">{hmos?.filter((h: HMO) => h.active).length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Encounters</p>
              <p className="text-2xl font-bold">
                {hmos?.reduce((sum: number, h: HMO) => sum + (h._count?.encounters || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enrolled Patients</p>
              <p className="text-2xl font-bold">
                {hmos?.reduce((sum: number, h: HMO) => sum + (h._count?.patients || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tariff Management Card */}
      <div className="bg-gradient-to-r from-tory-blue/10 to-spindle rounded-lg border-2 border-tory-blue/30 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-tory-blue flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">HMO Tariff Management</h2>
                  <p className="text-sm text-muted-foreground">
                    View and manage pricing data for all HMO providers
                  </p>
                </div>
              </div>
            </div>
            <Link href="/hmo/tariffs">
              <Button variant="primary" size="md">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Manage Tariffs
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Tariff Items</p>
              <p className="text-2xl font-bold text-tory-blue">
                {hmos?.reduce((sum: number, h: HMO) => sum + (h._count?.encounters || 0), 0)?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Search & Export</p>
              <p className="text-sm font-medium">Browse tariffs by HMO provider</p>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Import Data</p>
              <p className="text-sm font-medium">Upload Excel/CSV files</p>
            </div>
          </div>
        </div>
      </div>

      {/* HMO List */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">HMO Providers</h2>
        </div>

        <div className="p-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading HMOs...</p>
          ) : !hmos || hmos.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No HMOs configured yet</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First HMO
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {hmos.map((hmo: HMO) => (
                <div
                  key={hmo.id}
                  className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{hmo.name}</h3>
                        {!hmo.active && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Provider Code: {hmo.providerCode || 'Not set'}</span>
                        <span>•</span>
                        <span>Method: {hmo.submissionMethod}</span>
                        <span>•</span>
                        <span>{hmo._count?.patients || 0} patients</span>
                        <span>•</span>
                        <span>{hmo._count?.encounters || 0} encounters</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hmo.requiresAuthorization && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                          Requires Auth
                        </span>
                      )}
                      
                      <Link href={`/hmo/${hmo.id}/tariffs`}>
                        <Button variant="outline" size="sm">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Tariffs
                        </Button>
                      </Link>

                      <Link href={`/hmo/${hmo.id}`}>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create HMO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Add New HMO Provider</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="HMO Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Reliance HMO, AXA Mansard"
                required
              />

              <Input
                label="Provider Code"
                value={formData.providerCode}
                onChange={(e) => setFormData({ ...formData, providerCode: e.target.value })}
                placeholder="Your hospital's provider code with this HMO"
              />

              <Select
                label="Submission Method"
                value={formData.submissionMethod}
                onChange={(e) => setFormData({ ...formData, submissionMethod: e.target.value })}
              >
                <option value="email_pdf">Email (PDF)</option>
                <option value="portal_excel">Portal (Excel)</option>
                <option value="portal_csv">Portal (CSV)</option>
                <option value="api">API (Future)</option>
              </Select>

              <Input
                label="Required Format"
                value={formData.requiredFormat}
                onChange={(e) => setFormData({ ...formData, requiredFormat: e.target.value })}
                placeholder="PDF, Excel, CSV"
              />

              <Input
                label="Submission Email"
                type="email"
                value={formData.submissionEmail}
                onChange={(e) => setFormData({ ...formData, submissionEmail: e.target.value })}
                placeholder="claims@hmo.com"
              />

              <Select
                label="Coding Standard"
                value={formData.codingStandard}
                onChange={(e) => setFormData({ ...formData, codingStandard: e.target.value })}
              >
                <option value="icd10">ICD-10</option>
                <option value="cpt">CPT</option>
                <option value="local">Local Codes</option>
              </Select>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresAuth"
                  checked={formData.requiresAuthorization}
                  onChange={(e) =>
                    setFormData({ ...formData, requiresAuthorization: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="requiresAuth" className="text-sm">
                  Requires pre-authorization code
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={createHMO.isPending} className="flex-1">
                  {createHMO.isPending ? 'Creating...' : 'Create HMO'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
