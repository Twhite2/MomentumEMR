'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { ArrowLeft, Save, Plus, Trash2, Pill } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface Medication {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

export default function NewPrescriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');

  const [patientId, setPatientId] = useState(preSelectedPatientId || '');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [medications, setMedications] = useState<Medication[]>([
    { drugName: '', dosage: '', frequency: '', duration: '', notes: '' },
  ]);

  // Fetch patients
  const { data: patients } = useQuery<{ patients: Patient[] }>({
    queryKey: ['patients-all'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=100');
      return response.data;
    },
  });

  // Create prescription mutation
  const createPrescription = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/prescriptions', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Prescription created successfully!');
      router.push(`/prescriptions/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create prescription');
    },
  });

  const addMedication = () => {
    setMedications([
      ...medications,
      { drugName: '', dosage: '', frequency: '', duration: '', notes: '' },
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one medication has a drug name
    const validMedications = medications.filter((med) => med.drugName.trim() !== '');
    
    if (validMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    const payload = {
      patientId,
      treatmentPlan: treatmentPlan || null,
      medications: validMedications,
    };

    createPrescription.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/prescriptions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Prescriptions
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Prescription</h1>
          <p className="text-muted-foreground mt-1">Create medication order for patient</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Patient Selection */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
            <Select
              label="Patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
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
          </div>

          {/* Treatment Plan */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Treatment Plan</h2>
            <Textarea
              label="Clinical Notes & Instructions"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              rows={4}
              placeholder="Describe the treatment plan, special instructions, follow-up requirements..."
            />
          </div>

          {/* Medications */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Medications</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedication}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </div>

            <div className="space-y-6">
              {medications.map((medication, index) => (
                <div
                  key={index}
                  className="p-4 border border-border rounded-lg relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-green-haze" />
                      <h3 className="font-medium">Medication #{index + 1}</h3>
                    </div>
                    {medications.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-ribbon" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Drug Name"
                        value={medication.drugName}
                        onChange={(e) =>
                          updateMedication(index, 'drugName', e.target.value)
                        }
                        placeholder="e.g., Paracetamol"
                        required
                      />
                    </div>

                    <Input
                      label="Dosage"
                      value={medication.dosage}
                      onChange={(e) =>
                        updateMedication(index, 'dosage', e.target.value)
                      }
                      placeholder="e.g., 500mg"
                    />

                    <Input
                      label="Frequency"
                      value={medication.frequency}
                      onChange={(e) =>
                        updateMedication(index, 'frequency', e.target.value)
                      }
                      placeholder="e.g., Twice daily"
                    />

                    <Input
                      label="Duration"
                      value={medication.duration}
                      onChange={(e) =>
                        updateMedication(index, 'duration', e.target.value)
                      }
                      placeholder="e.g., 7 days"
                    />

                    <div className="md:col-span-2">
                      <Textarea
                        label="Special Instructions"
                        value={medication.notes}
                        onChange={(e) =>
                          updateMedication(index, 'notes', e.target.value)
                        }
                        rows={2}
                        placeholder="e.g., Take with food, avoid alcohol..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/prescriptions">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              loading={createPrescription.isPending}
              disabled={createPrescription.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Prescription
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
