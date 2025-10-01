'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Plus, FileText, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface MedicalRecord {
  id: number;
  visitDate: string;
  diagnosis: string | null;
  notes: string | null;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
  };
  doctor: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface MedicalRecordsResponse {
  records: MedicalRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function MedicalRecordsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<MedicalRecordsResponse>({
    queryKey: ['medical-records', page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await axios.get(`/api/medical-records?${params}`);
      return response.data;
    },
  });

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
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground mt-1">Patient visit documentation and clinical notes</p>
        </div>
        <Link href="/medical-records/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" />
            New Record
          </Button>
        </Link>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-tory-blue border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading medical records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load medical records</p>
          </div>
        ) : data?.records.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No medical records found</p>
            <Link href="/medical-records/new">
              <Button variant="primary" size="sm" className="mt-4">
                Create First Record
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.records.map((record) => (
                <div
                  key={record.id}
                  className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/medical-records/${record.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-green-haze/10 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-green-haze" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {record.patient.firstName} {record.patient.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Dr. {record.doctor.name}
                          </p>
                        </div>
                      </div>

                      <div className="ml-15 space-y-2">
                        {record.diagnosis && (
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {record.diagnosis}
                            </p>
                          </div>
                        )}
                        {record.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {record.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Visit: {formatDate(record.visitDate)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="w-4 h-4" />
                            Created: {formatDate(record.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/patients/${record.patient.id}`}
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
                  records
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
