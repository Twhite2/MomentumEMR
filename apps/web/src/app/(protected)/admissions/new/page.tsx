'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface PatientsResponse {
  patients: Patient[];
}

export default function NewAdmissionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    patientId: '',
    ward: '',
    bedNumber: '',
    admissionReason: '',
  });

  // Fetch patients
  const { data: patientsData } = useQuery<PatientsResponse>({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=1000');
      return response.data;
    },
  });

  const admitPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/admissions', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Patient admitted successfully');
      router.push('/admissions');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to admit patient');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.admissionReason) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Convert patientId to number
    const payload = {
      ...formData,
      patientId: parseInt(formData.patientId),
    };
    
    admitPatientMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admissions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Admit Patient</h1>
          <p className="text-muted-foreground mt-1">Admit patient for inpatient care</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">
              Patient <span className="text-red-ribbon">*</span>
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select a patient</option>
              {patientsData?.patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Ward */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Ward
            </label>
            <input
              type="text"
              value={formData.ward}
              onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., General Ward, ICU, Maternity"
            />
          </div>

          {/* Bed Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Bed Number
            </label>
            <input
              type="text"
              value={formData.bedNumber}
              onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., A-12, B-05"
            />
          </div>
        </div>

        {/* Admission Reason */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Admission Reason <span className="text-red-ribbon">*</span>
          </label>
          <textarea
            value={formData.admissionReason}
            onChange={(e) => setFormData({ ...formData, admissionReason: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
            placeholder="Enter reason for admission..."
            required
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Link href="/admissions">
            <Button variant="outline" size="md" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={admitPatientMutation.isPending}
          >
            {admitPatientMutation.isPending ? (
              'Admitting...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Admit Patient
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
