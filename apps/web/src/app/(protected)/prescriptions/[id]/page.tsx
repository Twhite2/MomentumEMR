'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { ArrowLeft, Pill, User, Calendar, CheckCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface Prescription {
  id: number;
  treatmentPlan: string | null;
  status: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    patientType: string;
  };
  doctor: {
    id: number;
    name: string;
    email: string;
  };
  prescriptionItems: Array<{
    id: number;
    drugName: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    notes: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const prescriptionId = params.id as string;

  const { data: prescription, isLoading, error } = useQuery<Prescription>({
    queryKey: ['prescription', prescriptionId],
    queryFn: async () => {
      const response = await axios.get(`/api/prescriptions/${prescriptionId}`);
      return response.data;
    },
  });

  // Mark as completed mutation
  const markCompleted = useMutation({
    mutationFn: async () => {
      const response = await axios.put(`/api/prescriptions/${prescriptionId}`, {
        status: 'completed',
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Prescription marked as completed');
      queryClient.invalidateQueries({ queryKey: ['prescription', prescriptionId] });
    },
    onError: () => {
      toast.error('Failed to update prescription status');
    },
  });

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-haze text-white';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-tory-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-ribbon mb-4">Failed to load prescription</p>
          <Link href="/prescriptions">
            <Button variant="outline">Back to Prescriptions</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/prescriptions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Prescription</h1>
            <p className="text-muted-foreground mt-1">RX-{prescription.id.toString().padStart(6, '0')}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(prescription.status)}`}>
          {prescription.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Medications */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-green-haze" />
              Medications ({prescription.prescriptionItems.length})
            </h2>
            <div className="space-y-4">
              {prescription.prescriptionItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 border border-border rounded-lg bg-green-haze/5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{item.drugName}</h3>
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {item.dosage && (
                      <div>
                        <p className="text-xs text-muted-foreground">Dosage</p>
                        <p className="text-sm font-medium">{item.dosage}</p>
                      </div>
                    )}
                    {item.frequency && (
                      <div>
                        <p className="text-xs text-muted-foreground">Frequency</p>
                        <p className="text-sm font-medium">{item.frequency}</p>
                      </div>
                    )}
                    {item.duration && (
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-medium">{item.duration}</p>
                      </div>
                    )}
                  </div>
                  {item.notes && (
                    <div className="mt-3 p-2 bg-saffron/10 rounded">
                      <p className="text-xs font-medium text-saffron mb-1">Special Instructions:</p>
                      <p className="text-sm">{item.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Treatment Plan */}
          {prescription.treatmentPlan && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-tory-blue" />
                Treatment Plan & Instructions
              </h2>
              <div className="p-4 bg-muted/50 border border-border rounded-lg">
                <p className="whitespace-pre-wrap">{prescription.treatmentPlan}</p>
              </div>
            </div>
          )}

          {/* Prescribing Doctor */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Prescribed By</h2>
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-danube/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-danube" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Dr. {prescription.doctor.name}</h3>
                <p className="text-sm text-muted-foreground">{prescription.doctor.email}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {formatDateTime(prescription.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Patient</h2>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-16 h-16 bg-tory-blue/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-tory-blue">
                  {prescription.patient.firstName.charAt(0)}
                  {prescription.patient.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {prescription.patient.firstName} {prescription.patient.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {calculateAge(prescription.patient.dob)} years • {prescription.patient.gender}
                </p>
              </div>
            </div>
            <Link href={`/patients/${prescription.patient.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <User className="w-4 h-4 mr-2" />
                View Patient Profile
              </Button>
            </Link>
          </div>

          {/* Prescription Summary */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Prescription Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-haze/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-green-haze" />
                  <span className="text-sm font-medium text-muted-foreground">Total Drugs</span>
                </div>
                <span className="text-2xl font-bold text-green-haze">
                  {prescription.prescriptionItems.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                  {prescription.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Pharmacy Actions */}
          {(session?.user?.role === 'pharmacist' || session?.user?.role === 'admin') && prescription.status === 'active' && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Pharmacy Actions</h2>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => markCompleted.mutate()}
                  loading={markCompleted.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Dispensed
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Click when all medications have been dispensed to the patient
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href={`/lab-orders/new?patientId=${prescription.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Order Lab Test
                </Button>
              </Link>
              <Link href={`/appointments/new?patientId=${prescription.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Schedule Follow-up
                </Button>
              </Link>
              <Link href={`/medical-records/new?patientId=${prescription.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Add Medical Record
                </Button>
              </Link>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDateTime(prescription.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDateTime(prescription.updatedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Patient Type</p>
                <p className="font-medium capitalize">
                  {prescription.patient.patientType.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
