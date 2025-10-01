'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');
  const appointmentId = searchParams.get('appointmentId');

  const [formData, setFormData] = useState({
    patientId: preSelectedPatientId || '',
    visitDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    notes: '',
  });

  // Fetch patients
  const { data: patients } = useQuery<{ patients: Patient[] }>({
    queryKey: ['patients-all'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=100');
      return response.data;
    },
  });

  // Create medical record mutation
  const createRecord = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/medical-records', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Medical record created successfully!');
      if (appointmentId) {
        // Update appointment status to completed
        axios.put(`/api/appointments/${appointmentId}`, { status: 'completed' }).catch(() => {});
      }
      router.push(`/medical-records/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create medical record');
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
      attachments: null, // TODO: Implement file upload
    };

    createRecord.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/medical-records">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Medical Records
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Medical Record</h1>
          <p className="text-muted-foreground mt-1">Document patient visit and clinical findings</p>
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
                disabled={!!preSelectedPatientId}
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
                label="Clinical Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={8}
                placeholder="Document patient symptoms, examination findings, treatment plan, and any other relevant clinical information..."
              />
            </div>
          </div>

          {/* File Attachments - Placeholder */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Attachments</h2>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                File upload feature coming soon
              </p>
              <p className="text-xs text-muted-foreground">
                Support for lab results, X-rays, scans, and other medical documents
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/medical-records">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              loading={createRecord.isPending}
              disabled={createRecord.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Medical Record
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
