'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
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

export default function NewNursingNotePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    patientId: '',
    noteType: 'assessment',
    note: '',
  });

  // Fetch patients
  const { data: patientsData } = useQuery<PatientsResponse>({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=1000');
      return response.data;
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.post('/api/nursing-notes', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Nursing note created successfully');
      router.push('/nursing-notes');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create nursing note');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.note) {
      toast.error('Please fill in all required fields');
      return;
    }
    createNoteMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/nursing-notes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Nursing Note</h1>
          <p className="text-muted-foreground mt-1">Document patient care and assessments</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Patient <span className="text-red-ribbon">*</span>
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
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

          {/* Note Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Note Type <span className="text-red-ribbon">*</span>
            </label>
            <select
              value={formData.noteType}
              onChange={(e) => setFormData({ ...formData, noteType: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
              required
            >
              <option value="assessment">Assessment</option>
              <option value="intervention">Intervention</option>
              <option value="progress">Progress</option>
              <option value="discharge_planning">Discharge Planning</option>
            </select>
          </div>
        </div>

        {/* Note Content */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Note <span className="text-red-ribbon">*</span>
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue min-h-[200px]"
            placeholder="Enter nursing note details..."
            required
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Link href="/nursing-notes">
            <Button variant="outline" size="md" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={createNoteMutation.isPending}
          >
            {createNoteMutation.isPending ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
