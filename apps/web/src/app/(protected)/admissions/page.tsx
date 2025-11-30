'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Plus, BedDouble, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Admission {
  id: number;
  ward: string | null;
  bedNumber: string | null;
  admissionReason: string;
  admissionDate: string;
  dischargeDate: string | null;
  status: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    bloodGroup: string | null;
  };
  admittingDoctor: {
    id: number;
    name: string;
  };
  dischargingDoctor?: {
    id: number;
    name: string;
  };
}

interface AdmissionsResponse {
  admissions: Admission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdmissionsPage() {
  const { data: session } = useSession();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  
  // Only doctors and admin can admit/discharge patients
  const canAdmitPatients = session?.user?.role === 'admin' || session?.user?.role === 'doctor';

  const { data, isLoading, error } = useQuery<AdmissionsResponse>({
    queryKey: ['admissions', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (status) params.append('status', status);

      const response = await axios.get(`/api/admissions?${params}`);
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admitted':
        return 'bg-primary/10 text-primary';
      case 'discharged':
        return 'bg-green-haze/10 text-green-haze';
      case 'transferred':
        return 'bg-saffron/10 text-saffron';
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admissions & Discharge</h1>
          <p className="text-muted-foreground mt-1">Manage inpatient admissions</p>
        </div>
        {canAdmitPatients && (
          <Link href="/admissions/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Admit Patient
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="admitted">Admitted</option>
            <option value="discharged">Discharged</option>
            <option value="transferred">Transferred</option>
          </select>

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

      {/* Admissions List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading admissions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load admissions</p>
          </div>
        ) : data?.admissions.length === 0 ? (
          <div className="text-center py-12">
            <BedDouble className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No admissions found</p>
            {canAdmitPatients && (
              <Link href="/admissions/new">
                <Button variant="primary" size="sm" className="mt-4">
                  Admit First Patient
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.admissions.map((admission) => (
                <div
                  key={admission.id}
                  className="p-6 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(admission.status)}`}>
                          {admission.status.toUpperCase()}
                        </span>
                        {admission.ward && (
                          <span className="text-sm text-muted-foreground">
                            Ward: {admission.ward} {admission.bedNumber && `- Bed ${admission.bedNumber}`}
                          </span>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground">
                          Reason: {admission.admissionReason}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Patient: {admission.patient.firstName} {admission.patient.lastName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Admitted: {formatDate(admission.admissionDate)}</span>
                        </div>
                        {admission.dischargeDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Discharged: {formatDate(admission.dischargeDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Link href={`/patients/${admission.patient.id}`}>
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
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
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
