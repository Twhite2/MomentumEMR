'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
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

interface Doctor {
  id: number;
  name: string;
}

interface Medication {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

interface InventoryItem {
  id: number;
  itemName: string;
  drugCategory: string | null;
  dosageStrength: string | null;
  dosageForm: string | null;
  stockQuantity: number;
}

// Duration options with day calculations
const DURATION_OPTIONS = [
  { value: '', label: 'Select duration', days: 0 },
  { value: '1 day', label: '1 day (1 day)', days: 1 },
  { value: '3 days', label: '3 days (3 days)', days: 3 },
  { value: '5 days', label: '5 days (5 days)', days: 5 },
  { value: '1 week', label: '1 week (7 days)', days: 7 },
  { value: '2 weeks', label: '2 weeks (14 days)', days: 14 },
  { value: '3 weeks', label: '3 weeks (21 days)', days: 21 },
  { value: '1 month', label: '1 month (30 days)', days: 30 },
  { value: '2 months', label: '2 months (60 days)', days: 60 },
  { value: '3 months', label: '3 months (90 days)', days: 90 },
  { value: 'custom', label: 'Custom duration', days: 0 },
];

const DRUG_CATEGORIES = [
  '', 'Antimalarial', 'Antibiotic', 'Analgesic', 'Antihypertensive', 
  'Antidiabetic', 'Antihistamine', 'Antacid', 'Vitamin', 'Other'
];

export default function NewPrescriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const requiresDoctorSelection = userRole && ['nurse', 'pharmacist', 'admin'].includes(userRole);

  const [patientId, setPatientId] = useState(preSelectedPatientId || '');
  const [doctorId, setDoctorId] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [medications, setMedications] = useState<Medication[]>([
    { drugName: '', dosage: '', frequency: '', duration: '', notes: '' },
  ]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customDurations, setCustomDurations] = useState<Record<number, string>>({});

  // Fetch inventory items for drug suggestions
  const { data: inventoryData } = useQuery<{ inventory: InventoryItem[] }>({
    queryKey: ['inventory-medications', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: 'Medication',
        limit: '100',
      });
      if (selectedCategory) {
        params.append('drugCategory', selectedCategory);
      }
      const response = await axios.get(`/api/inventory?${params}`);
      return response.data;
    },
  });

  // Fetch patients
  const { data: patients } = useQuery<{ patients: Patient[] }>({
    queryKey: ['patients-all'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=100');
      return response.data;
    },
  });

  // Fetch doctors (only if user is not a doctor)
  const { data: doctors } = useQuery<{ users: Doctor[] }>({
    queryKey: ['doctors-all'],
    queryFn: async () => {
      const response = await axios.get('/api/users?role=doctor&limit=100');
      return response.data;
    },
    enabled: requiresDoctorSelection,
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

  const updateCustomDuration = (index: number, value: string) => {
    setCustomDurations({ ...customDurations, [index]: value });
    updateMedication(index, 'duration', value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one medication has a drug name
    const validMedications = medications.filter((med) => med.drugName.trim() !== '');
    
    if (validMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    const payload: any = {
      patientId,
      treatmentPlan: treatmentPlan || null,
      medications: validMedications,
    };

    // Add doctorId if required
    if (requiresDoctorSelection) {
      if (!doctorId) {
        toast.error('Please select a prescribing doctor');
        return;
      }
      payload.doctorId = doctorId;
    }

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

          {/* Doctor Selection (for non-doctors) */}
          {requiresDoctorSelection && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Prescribing Doctor</h2>
              <Select
                label="Doctor"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
              >
                <option value="">Select doctor</option>
                {doctors?.users.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

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
              <div className="flex items-center gap-2">
                <Select
                  label=""
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-48"
                >
                  <option value="">All Categories</option>
                  {DRUG_CATEGORIES.filter(c => c).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
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
                      <label className="block text-sm font-medium mb-1">
                        Drug Name <span className="text-red-ribbon">*</span>
                      </label>
                      {inventoryData?.inventory && inventoryData.inventory.length > 0 ? (
                        <>
                          <Select
                            value={medication.drugName}
                            onChange={(e) => {
                              const selectedDrug = inventoryData.inventory.find(
                                (item) => item.itemName === e.target.value
                              );
                              updateMedication(index, 'drugName', e.target.value);
                              if (selectedDrug?.dosageStrength) {
                                updateMedication(index, 'dosage', selectedDrug.dosageStrength);
                              }
                            }}
                            required
                          >
                            <option value="">Select from inventory</option>
                            {inventoryData.inventory.map((item) => (
                              <option key={item.id} value={item.itemName}>
                                {item.itemName} 
                                {item.dosageStrength && ` - ${item.dosageStrength}`}
                                {item.dosageForm && ` (${item.dosageForm})`}
                                {` - Stock: ${item.stockQuantity}`}
                              </option>
                            ))}
                            <option value="__custom__">⊕ Custom/Not in inventory</option>
                          </Select>
                          {medication.drugName === '__custom__' && (
                            <Input
                              value=""
                              onChange={(e) => updateMedication(index, 'drugName', e.target.value)}
                              placeholder="Enter drug name"
                              className="mt-2"
                              required
                            />
                          )}
                        </>
                      ) : (
                        <Input
                          value={medication.drugName}
                          onChange={(e) =>
                            updateMedication(index, 'drugName', e.target.value)
                          }
                          placeholder="e.g., Paracetamol"
                          required
                        />
                      )}
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

                    <div>
                      <Select
                        label="Duration"
                        value={medication.duration === customDurations[index] ? 'custom' : medication.duration}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            updateMedication(index, 'duration', customDurations[index] || '');
                          } else {
                            updateMedication(index, 'duration', e.target.value);
                          }
                        }}
                      >
                        {DURATION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      {(medication.duration === customDurations[index] || 
                        !DURATION_OPTIONS.find(opt => opt.value === medication.duration)) && (
                        <Input
                          value={customDurations[index] || medication.duration}
                          onChange={(e) => updateCustomDuration(index, e.target.value)}
                          placeholder="e.g., 10 days"
                          className="mt-2"
                        />
                      )}
                    </div>

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
