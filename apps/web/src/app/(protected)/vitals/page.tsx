'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Plus, Activity, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Vital {
  id: number;
  bloodPressure: string | null;
  heartRate: number | null;
  temperature: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  recordedAt: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
  };
  recordedByUser: {
    id: number;
    name: string;
  };
}

interface VitalsResponse {
  vitals: Vital[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function VitalsPage() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  
  // Doctors, nurses, and admin can record vitals
  const canRecordVitals = ['admin', 'doctor', 'nurse'].includes(session?.user?.role || '');

  const { data, isLoading, error } = useQuery<VitalsResponse>({
    queryKey: ['vitals', page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await axios.get(`/api/vitals?${params}`);
      return response.data;
    },
  });

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
          <h1 className="text-3xl font-bold">Vitals</h1>
          <p className="text-muted-foreground mt-1">Record and monitor patient vital signs</p>
        </div>
        {canRecordVitals && (
          <Link href="/vitals/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Record Vitals
            </Button>
          </Link>
        )}
      </div>

      {/* Vitals List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading vitals...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load vitals</p>
          </div>
        ) : data?.vitals.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No vitals recorded yet</p>
            {canRecordVitals && (
              <Link href="/vitals/new">
                <Button variant="primary" size="sm" className="mt-4">
                  Record First Vitals
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.vitals.map((vital) => (
                <Link
                  key={vital.id}
                  href={`/vitals/${vital.id}`}
                  className="block p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(vital.recordedAt)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        {vital.bloodPressure && (
                          <div>
                            <p className="text-xs text-muted-foreground">Blood Pressure</p>
                            <p className="text-sm font-medium">{vital.bloodPressure} mmHg</p>
                          </div>
                        )}
                        {vital.heartRate && (
                          <div>
                            <p className="text-xs text-muted-foreground">Heart Rate</p>
                            <p className="text-sm font-medium">{vital.heartRate} bpm</p>
                          </div>
                        )}
                        {vital.temperature && (
                          <div>
                            <p className="text-xs text-muted-foreground">Temperature</p>
                            <p className="text-sm font-medium">{vital.temperature}°C</p>
                          </div>
                        )}
                        {vital.oxygenSaturation && (
                          <div>
                            <p className="text-xs text-muted-foreground">SpO2</p>
                            <p className="text-sm font-medium">{vital.oxygenSaturation}%</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Patient: {vital.patient.firstName} {vital.patient.lastName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          <span>By: {vital.recordedByUser.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm">
                        <User className="w-4 h-4 mr-2" />
                        View Patient
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total records)
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
