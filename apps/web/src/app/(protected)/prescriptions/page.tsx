'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Select } from '@momentum/ui';
import { Plus, Pill, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Prescription {
  id: number;
  treatmentPlan: string | null;
  status: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
  };
  doctor: {
    id: number;
    name: string;
  };
  prescriptionItems: Array<{
    id: number;
    drugName: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
  }>;
  createdAt: string;
}

interface PrescriptionsResponse {
  prescriptions: Prescription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PrescriptionsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canCreatePrescription = ['doctor', 'nurse', 'pharmacist', 'admin', 'super_admin'].includes(userRole || '');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<PrescriptionsResponse>({
    queryKey: ['prescriptions', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (status) params.append('status', status);

      const response = await axios.get(`/api/prescriptions?${params}`);
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-haze/10 text-green-haze';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'patient' 
              ? 'View your medication orders and treatment plans'
              : userRole === 'cashier'
              ? 'View prescriptions for billing and invoicing'
              : canCreatePrescription
              ? 'Manage medication orders and treatment plans'
              : 'View and dispense medication orders'}
          </p>
        </div>
        {canCreatePrescription && (
          <Link href="/prescriptions/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              New Prescription
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </Select>

          {status && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setStatus('')}
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading prescriptions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load prescriptions</p>
          </div>
        ) : data?.prescriptions.length === 0 ? (
          <div className="p-8 text-center">
            <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {userRole === 'pharmacist' 
                ? 'No prescriptions available yet'
                : userRole === 'cashier'
                ? 'No prescriptions to bill yet'
                : 'No prescriptions found'}
            </p>
            {canCreatePrescription && (
              <Link href="/prescriptions/new">
                <Button variant="primary" size="sm" className="mt-4">
                  Create First Prescription
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/prescriptions/${prescription.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-haze/10 rounded-full flex items-center justify-center">
                          <Pill className="w-6 h-6 text-green-haze" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {prescription.patient.firstName} {prescription.patient.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Prescribed by Dr. {prescription.doctor.name}
                          </p>
                        </div>
                      </div>

                      <div className="ml-15 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {prescription.prescriptionItems.length} medication(s)
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {prescription.prescriptionItems.slice(0, 3).map(item => item.drugName).join(', ')}
                            {prescription.prescriptionItems.length > 3 && '...'}
                          </span>
                        </div>

                        {prescription.treatmentPlan && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {prescription.treatmentPlan}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(prescription.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getStatusColor(
                          prescription.status
                        )}`}
                      >
                        {prescription.status.toUpperCase()}
                      </span>
                      <Link
                        href={`/patients/${prescription.patient.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="sm">
                          <User className="w-4 h-4 mr-2" />
                          View Patient
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to{' '}
                  {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}{' '}
                  prescriptions
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

