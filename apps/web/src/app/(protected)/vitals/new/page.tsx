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

export default function NewVitalsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    patientId: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
  });

  // Fetch patients
  const { data: patientsData } = useQuery<PatientsResponse>({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=1000');
      return response.data;
    },
  });

  const createVitalsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/vitals', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Vitals recorded successfully');
      router.push('/vitals');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record vitals');
    },
  });

  // Handle blood pressure input with auto-slash
  const handleBloodPressureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove any non-digit characters except /
    value = value.replace(/[^0-9/]/g, '');
    
    // Auto-add slash after 3 digits
    if (value.length === 3 && !value.includes('/')) {
      value = value + '/';
    }
    
    // Prevent multiple slashes
    const slashCount = (value.match(/\//g) || []).length;
    if (slashCount > 1) {
      value = value.slice(0, -1);
    }
    
    // Limit format to XXX/XXX
    if (value.length > 7) {
      value = value.slice(0, 7);
    }
    
    setFormData({ ...formData, bloodPressure: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId) {
      toast.error('Please select a patient');
      return;
    }

    // Convert empty strings to null and parse numbers
    const payload = {
      patientId: parseInt(formData.patientId),
      bloodPressure: formData.bloodPressure || null,
      heartRate: formData.heartRate ? parseFloat(formData.heartRate) : null,
      temperature: formData.temperature ? parseFloat(formData.temperature) : null,
      respiratoryRate: formData.respiratoryRate ? parseFloat(formData.respiratoryRate) : null,
      oxygenSaturation: formData.oxygenSaturation ? parseFloat(formData.oxygenSaturation) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
    };

    createVitalsMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vitals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Record Vitals</h1>
          <p className="text-muted-foreground mt-1">Record patient vital signs</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Blood Pressure */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Blood Pressure <span className="text-muted-foreground font-normal">(mmHg)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.bloodPressure}
                onChange={handleBloodPressureChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
                placeholder="120/80"
                maxLength={7}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                mmHg
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Format: Systolic/Diastolic (e.g., 120/80)</p>
          </div>

          {/* Heart Rate */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Heart Rate (Pulse)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={formData.heartRate}
                onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                className="w-full px-4 py-2 pr-16 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
                placeholder="72"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                bpm
              </span>
            </div>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Temperature
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                className="w-full px-4 py-2 pr-12 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
                placeholder="37.0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                °C
              </span>
            </div>
          </div>

          {/* Respiratory Rate */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Respiratory Rate
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={formData.respiratoryRate}
                onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                className="w-full px-4 py-2 pr-24 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
                placeholder="16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                breaths/min
              </span>
            </div>
          </div>

          {/* Oxygen Saturation */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Oxygen Saturation (SpO₂)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.oxygenSaturation}
                onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                className="w-full px-4 py-2 pr-12 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
                placeholder="98.0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Weight
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-4 py-2 pr-12 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
                placeholder="70.0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                kg
              </span>
            </div>
          </div>

          {/* Height */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Height
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full px-4 py-2 pr-12 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
                placeholder="170.0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                cm
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Link href="/vitals">
            <Button variant="outline" size="md" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={createVitalsMutation.isPending}
          >
            {createVitalsMutation.isPending ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Record Vitals
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
