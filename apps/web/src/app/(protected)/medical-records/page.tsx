'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Plus, FileText, Calendar, User, X } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import ExcelImportExport from '@/components/shared/ExcelImportExport';

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

interface GroupedPatientRecord {
  patientId: number;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    patientType: string;
  };
  totalVisits: number;
  latestVisit: {
    id: number;
    visitDate: string;
    diagnosis: string | null;
    doctor: {
      id: number;
      name: string;
    };
  } | null;
}

interface MedicalRecordsResponse {
  records: (MedicalRecord | GroupedPatientRecord)[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  grouped?: boolean;
}

export default function MedicalRecordsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  
  // Get URL parameters
  const patientIdParam = searchParams.get('patientId');
  const groupByPatientParam = searchParams.get('groupByPatient');
  
  // Check if user can create/edit medical records (admin or doctor only, not nurse)
  const canEditRecords = session?.user?.role === 'admin' || session?.user?.role === 'doctor';

  const { data, isLoading, error } = useQuery<MedicalRecordsResponse>({
    queryKey: ['medical-records', page, patientIdParam, groupByPatientParam],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (patientIdParam) {
        params.append('patientId', patientIdParam);
      }
      if (groupByPatientParam) {
        params.append('groupByPatient', groupByPatientParam);
      }

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

  const isGroupedRecord = (record: any): record is GroupedPatientRecord => {
    return 'totalVisits' in record && 'latestVisit' in record;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground mt-1">Patient visit documentation and clinical notes</p>
        </div>
        {canEditRecords && (
          <Link href="/medical-records/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              New Record
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Indicator */}
      {patientIdParam && data?.records && data.records.length > 0 && (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            Viewing records for:{' '}
            {!isGroupedRecord(data.records[0]) && (data.records[0] as MedicalRecord).patient
              ? `${(data.records[0] as MedicalRecord).patient.firstName} ${(data.records[0] as MedicalRecord).patient.lastName}`
              : 'Patient'}
          </span>
          <button
            onClick={() => router.push('/medical-records')}
            className="ml-auto flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            <X className="w-4 h-4" />
            Clear Filter
          </button>
        </div>
      )}

      {/* Excel Import/Export */}
      {canEditRecords && (
        <ExcelImportExport
          title="Bulk Medical Records Import"
          description="Download Excel template, fill offline, and upload for batch record creation"
          templateEndpoint="/api/medical-records/excel/template"
          importEndpoint="/api/medical-records/excel/import"
          templateFilename="Medical_Records_Template"
          queryKey={['medical-records']}
        />
      )}

      {/* Records List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading medical records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load medical records</p>
          </div>
        ) : data?.records.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No medical records found</p>
            {canEditRecords && (
              <Link href="/medical-records/new">
                <Button variant="primary" size="sm" className="mt-4">
                  Create First Record
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.records.map((record) => {
                if (isGroupedRecord(record)) {
                  // Grouped view - one line per patient
                  return (
                    <div
                      key={record.patientId}
                      className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => {
                        if (record.latestVisit?.id) {
                          window.location.href = `/medical-records/${record.latestVisit.id}`;
                        } else {
                          window.location.href = `/patients/${record.patient.id}`;
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-tory-blue/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-tory-blue" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-base">
                                {record.patient.firstName} {record.patient.lastName}
                              </h3>
                              <span className="px-2 py-0.5 bg-tory-blue/10 text-tory-blue rounded-full text-xs font-medium">
                                {record.totalVisits} {record.totalVisits === 1 ? 'Visit' : 'Visits'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{calculateAge(record.patient.dob)} yrs • {record.patient.gender}</span>
                              {record.latestVisit && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Last visit: {formatDate(record.latestVisit.visitDate)}
                                  </div>
                                  <span>•</span>
                                  <span>Dr. {record.latestVisit.doctor.name}</span>
                                </>
                              )}
                            </div>
                            {record.latestVisit?.diagnosis && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {record.latestVisit.diagnosis}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/medical-records?patientId=${record.patient.id}&groupByPatient=false`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outline" size="sm">
                              <FileText className="w-4 h-4 mr-2" />
                              View Records
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Individual record view
                  const medicalRecord = record as MedicalRecord;
                  return (
                    <div
                      key={medicalRecord.id}
                      className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => (window.location.href = `/medical-records/${medicalRecord.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-green-haze/10 rounded-full flex items-center justify-center">
                              <FileText className="w-6 h-6 text-green-haze" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {medicalRecord.patient.firstName} {medicalRecord.patient.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Dr. {medicalRecord.doctor.name}
                              </p>
                            </div>
                          </div>

                          <div className="ml-15 space-y-2">
                            {medicalRecord.diagnosis && (
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {medicalRecord.diagnosis}
                                </p>
                              </div>
                            )}
                            {medicalRecord.notes && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {medicalRecord.notes}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                Visit: {formatDate(medicalRecord.visitDate)}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="w-4 h-4" />
                                Created: {formatDate(medicalRecord.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Link
                            href={`/patients/${medicalRecord.patient.id}`}
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
                  );
                }
              })}
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

