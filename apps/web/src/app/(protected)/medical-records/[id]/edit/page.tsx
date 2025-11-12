'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { ArrowLeft, Save, FileText, Upload, X, File } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface MedicalRecord {
  id: number;
  patientId: number;
  visitDate: string;
  diagnosis: string | null;
  notes: string | null;
  attachments: any;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export default function EditMedicalRecordPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;
  const { data: session } = useSession();
  const isLabTech = session?.user?.role === 'lab_tech';

  const [formData, setFormData] = useState({
    patientId: '',
    visitDate: '',
    diagnosis: '',
    notes: '',
  });

  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; size: number }>>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch medical record
  const { data: record, isLoading } = useQuery<MedicalRecord>({
    queryKey: ['medical-record', recordId],
    queryFn: async () => {
      const response = await axios.get(`/api/medical-records/${recordId}`);
      return response.data;
    },
  });

  // Populate form when record loads
  useEffect(() => {
    if (record) {
      setFormData({
        patientId: record.patientId.toString(),
        visitDate: new Date(record.visitDate).toISOString().split('T')[0],
        diagnosis: record.diagnosis || '',
        notes: record.notes || '',
      });

      // Parse attachments if they exist
      if (record.attachments) {
        try {
          const parsed = typeof record.attachments === 'string' 
            ? JSON.parse(record.attachments) 
            : record.attachments;
          setAttachments(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setAttachments([]);
        }
      }
    }
  }, [record]);

  // Fetch patients
  const { data: patients } = useQuery<{ patients: Patient[] }>({
    queryKey: ['patients-all'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=100');
      return response.data;
    },
  });

  // Update medical record mutation
  const updateRecord = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/medical-records/${recordId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Medical record updated successfully!');
      router.push(`/medical-records/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update medical record');
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      patientId: formData.patientId,
      visitDate: formData.visitDate,
      diagnosis: formData.diagnosis || null,
      notes: formData.notes || null,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
    };

    updateRecord.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-tory-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-ribbon mb-4">Medical record not found</p>
          <Link href="/medical-records">
            <Button variant="outline">Back to Medical Records</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/medical-records/${recordId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Record
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Medical Record</h1>
          <p className="text-muted-foreground mt-1">Update patient visit and clinical findings</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-border p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Patient"
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                required
                disabled
              >
                <option value="">Select patient</option>
                {patients?.patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} (ID: P-
                    {patient.id.toString().padStart(6, '0')})
                  </option>
                ))}
              </Select>

              <Input
                label="Visit Date"
                name="visitDate"
                type="date"
                value={formData.visitDate}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Clinical Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Clinical Information</h2>
            <div className="space-y-4">
              <Textarea
                label="Diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter patient diagnosis..."
                required
              />

              <Textarea
                label={isLabTech ? "Lab Notes" : "Clinical Notes"}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={8}
                placeholder="Document patient symptoms, examination findings, treatment plan, and any other relevant clinical information..."
              />
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Attachments</h2>
            <div className="border-2 border-dashed border-border rounded-lg p-6">
              {/* Upload Area */}
              <div className="text-center mb-4">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    setUploading(true);
                    try {
                      const formData = new FormData();
                      files.forEach((file) => formData.append('files', file));
                      formData.append('folder', 'medical-records');

                      const response = await axios.post('/api/upload/file', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });

                      // Handle single or multiple file response
                      const newFiles = response.data.files 
                        ? response.data.files 
                        : [response.data.file];

                      setAttachments((prev) => [...prev, ...newFiles]);
                      toast.success(`${files.length} file(s) uploaded successfully!`);
                    } catch (error: any) {
                      toast.error(error.response?.data?.error || 'Failed to upload files');
                    } finally {
                      setUploading(false);
                      // Reset input
                      e.target.value = '';
                    }
                  }}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Support for lab results, X-rays, scans, PDFs, and images (Max 10MB per file)
                </p>
              </div>

              {/* Uploaded Files List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Uploaded Files ({attachments.length})</p>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachments((prev) => prev.filter((_, i) => i !== index));
                          toast.success('File removed');
                        }}
                        className="p-1 hover:bg-red-100 rounded text-red-600 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {attachments.length === 0 && !uploading && (
                <div className="text-center py-4">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No files uploaded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href={`/medical-records/${recordId}`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              loading={updateRecord.isPending}
              disabled={updateRecord.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Update Medical Record
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
