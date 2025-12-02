'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { ArrowLeft, Save, TestTube } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

export default function NewLabOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');

  const [formData, setFormData] = useState({
    patientId: preSelectedPatientId || '',
    orderType: 'Lab_Test',
    description: '',
    assignedTo: '', // Lab scientist assignment (optional)
  });
  const [customTestType, setCustomTestType] = useState('');

  // Fetch patients
  const { data: patients, isLoading: patientsLoading, error: patientsError } = useQuery<{ patients: Patient[] }>({
    queryKey: ['patients-all'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=100');
      return response.data;
    },
  });

  // Fetch lab scientists for assignment
  const { data: labScientists, isLoading: labScientistsLoading } = useQuery<{ labScientists: Array<{ id: number; name: string; email: string }> }>({
    queryKey: ['lab-scientists'],
    queryFn: async () => {
      const response = await axios.get('/api/users/lab-scientists');
      return response.data;
    },
  });

  // Debug: Log patients data
  console.log('Patients data:', patients);
  console.log('Patients loading:', patientsLoading);
  console.log('Patients error:', patientsError);

  // Create lab order mutation
  const createLabOrder = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/lab-orders', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Lab order created successfully!');
      router.push(`/lab-orders/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create lab order');
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

    // Validate patient selection
    if (!formData.patientId || formData.patientId === '') {
      toast.error('Please select a patient');
      return;
    }

    // Use custom test type if "Other" is selected
    const finalOrderType = formData.orderType === 'Other' ? customTestType : formData.orderType;

    if (formData.orderType === 'Other' && !customTestType.trim()) {
      toast.error('Please specify the custom test type');
      return;
    }

    const payload = {
      patientId: formData.patientId,
      orderType: finalOrderType,
      description: formData.description || null,
      assignedTo: formData.assignedTo || null,
    };

    createLabOrder.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={preSelectedPatientId ? `/patients/${preSelectedPatientId}` : "/lab-orders"}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {preSelectedPatientId ? "Back to Patient" : "Back to Lab Orders"}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Lab Order</h1>
          <p className="text-muted-foreground mt-1">Request diagnostic test for patient</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-border p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
            <Select
              label="Patient"
              name="patientId"
              value={formData.patientId}
              onChange={handleInputChange}
              required
              disabled={!!preSelectedPatientId || patientsLoading}
            >
              {patientsLoading ? (
                <option value="">Loading patients...</option>
              ) : patientsError ? (
                <option value="">Error loading patients</option>
              ) : !patients?.patients || patients.patients.length === 0 ? (
                <option value="">No patients found</option>
              ) : (
                <>
                  <option value="">Select patient</option>
                  {patients.patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} (ID: P-
                      {patient.id.toString().padStart(6, '0')})
                    </option>
                  ))}
                </>
              )}
            </Select>
            {patientsError && (
              <p className="text-sm text-red-ribbon mt-1">
                Failed to load patients. Please try refreshing the page.
              </p>
            )}
            {!patientsLoading && !patientsError && patients?.patients?.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No patients found. <Link href="/patients/new" className="text-primary hover:underline">Create a patient first</Link>
              </p>
            )}
          </div>

          {/* Lab Scientist Assignment (Optional) */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Lab Scientist Assignment (Optional)</h2>
            <Select
              label="Assign to Lab Scientist"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleInputChange}
              disabled={labScientistsLoading}
            >
              <option value="">General Pool (Any lab scientist)</option>
              {labScientists?.labScientists?.map((scientist) => (
                <option key={scientist.id} value={scientist.id}>
                  {scientist.name}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to make this order available to all lab scientists
            </p>
          </div>

          {/* Test Details */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Test Details</h2>
            <div className="space-y-4">
              <Select
                label="Test Type"
                name="orderType"
                value={formData.orderType}
                onChange={handleInputChange}
                required
              >
                <option value="Lab_Test">Lab Test (Blood, Urine, etc.)</option>
                <option value="X_ray">X-Ray</option>
                <option value="CT_Scan">CT Scan</option>
                <option value="MRI">MRI</option>
                <option value="Ultrasound">Ultrasound</option>
                <option value="Pathology">Pathology</option>
                <option value="Other">Other (Specify Custom Type)</option>
              </Select>

              {formData.orderType === 'Other' && (
                <Input
                  label="Custom Test Type"
                  placeholder="Enter custom test type (e.g., ECG, EEG, Biopsy, etc.)"
                  value={customTestType}
                  onChange={(e) => setCustomTestType(e.target.value)}
                  required
                />
              )}

              <Textarea
                label="Test Description & Instructions"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Enter specific tests to be performed, special instructions, clinical indications..."
                required
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TestTube className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-primary">Order Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Test type: <span className="font-medium text-foreground">
                {formData.orderType === 'Other' 
                  ? customTestType || 'Other (Not specified)' 
                  : formData.orderType.replace('_', ' ')}
              </span>
            </p>
            {formData.patientId && (
              <p className="text-sm text-muted-foreground mt-1">
                Patient: <span className="font-medium text-foreground">
                  {patients?.patients.find((p) => p.id.toString() === formData.patientId)?.firstName}{' '}
                  {patients?.patients.find((p) => p.id.toString() === formData.patientId)?.lastName}
                </span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/lab-orders">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              loading={createLabOrder.isPending}
              disabled={createLabOrder.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Lab Order
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

