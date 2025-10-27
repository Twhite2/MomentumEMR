'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Plus, Search, Filter, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Patient {
  id: number | string;
  userId?: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string | null;
  patientType: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  primaryDoctor?: {
    id: number;
    name: string;
    email: string;
  };
  hmo?: {
    id: number;
    policyName: string;
    provider: string;
  };
  corporateClient?: {
    id: number;
    companyName: string;
  };
  isUserOnly?: boolean;
  createdAt: string;
}

interface PatientsResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PatientsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [patientType, setPatientType] = useState('');
  const [page, setPage] = useState(1);
  
  // Check if user can create patients (admin only - nurses can only view)
  const canCreatePatients = session?.user?.role === 'admin';

  const { data, isLoading, error } = useQuery<PatientsResponse>({
    queryKey: ['patients', search, patientType, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (patientType) params.append('patientType', patientType);

      const response = await axios.get(`/api/patients?${params}`);
      return response.data;
    },
  });

  const getPatientTypeColor = (type: string) => {
    switch (type) {
      case 'hmo':
        return 'bg-primary/10 text-primary';
      case 'corporate':
        return 'bg-danube/10 text-danube';
      case 'self_pay':
        return 'bg-green-haze/10 text-green-haze';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-muted-foreground mt-1">
            Manage patient records and information
          </p>
        </div>
        {canCreatePatients && (
          <Link href="/patients/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
            />
          </div>

          {/* Patient Type Filter */}
          <select
            value={patientType}
            onChange={(e) => setPatientType(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
          >
            <option value="">All Types</option>
            <option value="hmo">HMO</option>
            <option value="corporate">Corporate</option>
            <option value="self_pay">Self Pay</option>
          </select>

          <Button variant="outline" size="md">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading patients...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load patients</p>
          </div>
        ) : data?.patients.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No patients found</p>
            <Link href="/patients/new">
              <Button variant="primary" size="sm" className="mt-4">
                Add First Patient
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Age/Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Primary Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Insurance/Client
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.patients.map((patient) => (
                    <tr key={patient.id || `user-${patient.userId}`} className={`hover:bg-muted/50 ${patient.isUserOnly ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {patient.firstName.charAt(0)}
                              {patient.lastName?.charAt(0) || ''}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </p>
                            {patient.isUserOnly ? (
                              <p className="text-xs text-amber-600 font-medium">
                                User Account Only • {patient.user?.email}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                ID: P-{patient.id.toString().padStart(6, '0')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">
                          {calculateAge(patient.dob)} years
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {patient.gender || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getPatientTypeColor(
                            patient.patientType
                          )}`}
                        >
                          {patient.patientType === 'self_pay' ? 'Self Pay' : patient.patientType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {patient.primaryDoctor ? (
                          <div>
                            <p className="text-sm font-medium">{patient.primaryDoctor.name}</p>
                            <p className="text-xs text-muted-foreground">{patient.primaryDoctor.email}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not assigned</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{patient.contactInfo?.phone || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          {patient.contactInfo?.email || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {patient.hmo ? (
                          <div>
                            <p className="text-sm font-medium">{patient.hmo.policyName}</p>
                            <p className="text-xs text-muted-foreground">{patient.hmo.provider}</p>
                          </div>
                        ) : patient.corporateClient ? (
                          <div>
                            <p className="text-sm font-medium">{patient.corporateClient.companyName}</p>
                            <p className="text-xs text-muted-foreground">Corporate</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Self Pay</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {patient.isUserOnly ? (
                          <Link href={`/patients/new?userId=${patient.userId}`}>
                            <Button variant="outline" size="sm" className="text-amber-600 border-amber-600 hover:bg-amber-50">
                              Create Record
                            </Button>
                          </Link>
                        ) : patient.id ? (
                          <Link href={`/patients/${patient.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="ghost" size="sm" disabled>
                            No Record
                          </Button>
                        )}
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
                  Showing {(page - 1) * 10 + 1} to{' '}
                  {Math.min(page * 10, data.pagination.total)} of {data.pagination.total}{' '}
                  patients
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

