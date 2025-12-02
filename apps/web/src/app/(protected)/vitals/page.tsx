'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Plus, Activity, Calendar, User, Upload, Download, X, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

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
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // Doctors, nurses, and admin can record vitals
  const canRecordVitals = ['admin', 'doctor', 'nurse'].includes(session?.user?.role || '');

  // Download Excel template
  const handleDownloadTemplate = async () => {
    try {
      toast.info('Downloading template...');
      const response = await axios.get('/api/vitals/excel/template', {
        responseType: 'blob',
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Vitals_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      console.error('Template download error:', error);
      toast.error(error.response?.data?.error || 'Failed to download template');
    }
  };

  // Upload Excel file mutation
  const uploadExcelMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('/api/vitals/excel/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setUploading(false);
      setUploadResults(data);
      
      if (data.imported > 0) {
        toast.success(`Successfully imported ${data.imported} vital record(s)`);
        queryClient.invalidateQueries({ queryKey: ['vitals'] });
      }
      
      if (data.failed > 0) {
        toast.warning(`${data.failed} record(s) failed to import. Check details below.`);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      setUploading(false);
      console.error('Excel upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload file');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    toast.info('Processing Excel file...');
    uploadExcelMutation.mutate(file);
  };

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
          <div className="flex gap-3">
            <Link href="/vitals/new">
              <Button variant="primary" size="md">
                <Plus className="w-4 h-4 mr-2" />
                Record Vitals
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Excel Import/Export Section */}
      {canRecordVitals && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Bulk Vitals Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Download Excel template, fill offline, and upload for batch import
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={handleDownloadTemplate}
                className="bg-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="vitals-excel-upload"
                  disabled={uploading}
                />
                <label htmlFor="vitals-excel-upload" className="cursor-pointer">
                  <span
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      uploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload Excel'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Upload Results */}
          {uploadResults && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  {uploadResults.imported > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  )}
                  Upload Results
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadResults(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-sm text-green-700">Successfully Imported</p>
                  <p className="text-2xl font-bold text-green-600">{uploadResults.imported}</p>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <p className="text-sm text-red-700">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{uploadResults.failed}</p>
                </div>
              </div>

              {uploadResults.errors && uploadResults.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Errors:</p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {uploadResults.errors.map((error: any, index: number) => (
                      <div key={index} className="text-sm p-2 bg-red-50 rounded border border-red-200">
                        <p className="font-medium text-red-700">Row {error.row}</p>
                        <ul className="list-disc list-inside text-red-600">
                          {error.errors.map((err: string, i: number) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
