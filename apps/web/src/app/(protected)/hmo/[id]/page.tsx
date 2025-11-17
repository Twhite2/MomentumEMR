'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { ArrowLeft, Edit, Save, X, FileText, Users, Building2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface HMO {
  id: number;
  name: string;
  providerCode: string;
  submissionMethod: string;
  requiredFormat: string;
  submissionEmail: string;
  submissionPortalUrl: string;
  codingStandard: string;
  requiresAuthorization: boolean;
  coverageDetails: any;
  copaymentRules: any;
  active: boolean;
  _count: {
    patients: number;
    encounters: number;
    claimBatches: number;
  };
}

export default function HMODetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const hmoId = params.id as string;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    providerCode: '',
    submissionMethod: 'email_pdf',
    requiredFormat: 'PDF',
    submissionEmail: '',
    submissionPortalUrl: '',
    codingStandard: 'icd10',
    requiresAuthorization: true,
    active: true,
  });

  // Fetch HMO details
  const { data: hmo, isLoading } = useQuery<HMO>({
    queryKey: ['hmo', hmoId],
    queryFn: async () => {
      const response = await axios.get(`/api/hmo/${hmoId}`);
      const data = response.data;
      // Populate form
      setFormData({
        name: data.name || '',
        providerCode: data.providerCode || '',
        submissionMethod: data.submissionMethod || 'email_pdf',
        requiredFormat: data.requiredFormat || 'PDF',
        submissionEmail: data.submissionEmail || '',
        submissionPortalUrl: data.submissionPortalUrl || '',
        codingStandard: data.codingStandard || 'icd10',
        requiresAuthorization: data.requiresAuthorization ?? true,
        active: data.active ?? true,
      });
      return data;
    },
    enabled: !!hmoId,
  });

  // Update HMO mutation
  const updateHMO = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/hmo/${hmoId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('HMO updated successfully');
      queryClient.invalidateQueries({ queryKey: ['hmo', hmoId] });
      queryClient.invalidateQueries({ queryKey: ['hmos'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update HMO');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHMO.mutate(formData);
  };

  const handleCancel = () => {
    if (hmo) {
      setFormData({
        name: hmo.name || '',
        providerCode: hmo.providerCode || '',
        submissionMethod: hmo.submissionMethod || 'email_pdf',
        requiredFormat: hmo.requiredFormat || 'PDF',
        submissionEmail: hmo.submissionEmail || '',
        submissionPortalUrl: hmo.submissionPortalUrl || '',
        codingStandard: hmo.codingStandard || 'icd10',
        requiresAuthorization: hmo.requiresAuthorization ?? true,
        active: hmo.active ?? true,
      });
    }
    setIsEditing(false);
  };

  const hasAccess = ['admin', 'cashier'].includes(session?.user?.role || '');

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading HMO details...</p>
      </div>
    );
  }

  if (!hmo) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-muted-foreground">HMO not found</p>
        <Link href="/hmo">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to HMO List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hmo">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="w-8 h-8" />
              {hmo.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Provider Code: {hmo.providerCode || 'Not set'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button onClick={handleSubmit} disabled={updateHMO.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateHMO.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enrolled Patients</p>
              <p className="text-2xl font-bold">{hmo._count?.patients || 0}</p>
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
              <p className="text-2xl font-bold">{hmo._count?.encounters || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Claim Batches</p>
              <p className="text-2xl font-bold">{hmo._count?.claimBatches || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">HMO Configuration</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="HMO Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              required
            />

            <Input
              label="Provider Code"
              value={formData.providerCode}
              onChange={(e) => setFormData({ ...formData, providerCode: e.target.value })}
              disabled={!isEditing}
              placeholder="Your hospital's provider code"
            />

            <Select
              label="Submission Method"
              value={formData.submissionMethod}
              onChange={(e) => setFormData({ ...formData, submissionMethod: e.target.value })}
              disabled={!isEditing}
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
              disabled={!isEditing}
              placeholder="PDF, Excel, CSV"
            />

            <Input
              label="Submission Email"
              type="email"
              value={formData.submissionEmail}
              onChange={(e) => setFormData({ ...formData, submissionEmail: e.target.value })}
              disabled={!isEditing}
              placeholder="claims@hmo.com"
            />

            <Input
              label="Submission Portal URL"
              value={formData.submissionPortalUrl}
              onChange={(e) => setFormData({ ...formData, submissionPortalUrl: e.target.value })}
              disabled={!isEditing}
              placeholder="https://portal.hmo.com"
            />

            <Select
              label="Coding Standard"
              value={formData.codingStandard}
              onChange={(e) => setFormData({ ...formData, codingStandard: e.target.value })}
              disabled={!isEditing}
            >
              <option value="icd10">ICD-10</option>
              <option value="cpt">CPT</option>
              <option value="local">Local Codes</option>
            </Select>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresAuth"
                  checked={formData.requiresAuthorization}
                  onChange={(e) =>
                    setFormData({ ...formData, requiresAuthorization: e.target.checked })
                  }
                  disabled={!isEditing}
                  className="w-4 h-4"
                />
                <label htmlFor="requiresAuth" className="text-sm">
                  Requires pre-authorization code
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  disabled={!isEditing}
                  className="w-4 h-4"
                />
                <label htmlFor="active" className="text-sm">
                  Active
                </label>
              </div>
            </div>
          </div>

          {!hmo.active && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ This HMO is currently inactive. Activate it to allow new encounters and claims.
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="w-full" disabled>
            <FileText className="w-4 h-4 mr-2" />
            View Encounters
          </Button>
          <Button variant="outline" className="w-full" disabled>
            <Building2 className="w-4 h-4 mr-2" />
            View Claims
          </Button>
          <Button variant="outline" className="w-full" disabled>
            <Users className="w-4 h-4 mr-2" />
            View Patients
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Coming soon: Direct access to encounters, claims, and patient records for this HMO
        </p>
      </div>
    </div>
  );
}
