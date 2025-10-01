'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { ArrowLeft, Edit, Calendar, FileText, Pill, TestTube, DollarSign, User } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useParams } from 'next/navigation';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  patientType: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  address: string;
  emergencyContact: string;
  hmo?: {
    id: number;
    policyName: string;
    provider: string;
  };
  corporateClient?: {
    id: number;
    companyName: string;
  };
  appointments?: any[];
  medicalRecords?: any[];
  prescriptions?: any[];
  invoices?: any[];
  labOrders?: any[];
  createdAt: string;
}

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;

  const { data: patient, isLoading, error } = useQuery<Patient>({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await axios.get(`/api/patients/${patientId}`);
      return response.data;
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

  const getPatientTypeColor = (type: string) => {
    switch (type) {
      case 'hmo':
        return 'bg-tory-blue/10 text-tory-blue';
      case 'corporate':
        return 'bg-danube/10 text-danube';
      case 'self_pay':
        return 'bg-green-haze/10 text-green-haze';
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

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-ribbon mb-4">Failed to load patient information</p>
          <Link href="/patients">
            <Button variant="outline">Back to Patients</Button>
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
          <Link href="/patients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">
              Patient ID: P-{patient.id.toString().padStart(6, '0')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/patients/${patient.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/appointments/new?patientId=${patient.id}`}>
            <Button variant="primary">
              <Calendar className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-tory-blue/10 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-tory-blue">
                  {patient.firstName.charAt(0)}
                  {patient.lastName.charAt(0)}
                </span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-4">
              {patient.firstName} {patient.lastName}
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Age & Gender</p>
                <p className="font-medium">
                  {calculateAge(patient.dob)} years • {patient.gender}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {new Date(patient.dob).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Patient Type</p>
                <span
                  className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${getPatientTypeColor(
                    patient.patientType
                  )}`}
                >
                  {patient.patientType === 'self_pay'
                    ? 'Self Pay'
                    : patient.patientType.toUpperCase()}
                </span>
              </div>

              {patient.hmo && (
                <div>
                  <p className="text-xs text-muted-foreground">HMO Coverage</p>
                  <p className="font-medium">{patient.hmo.policyName}</p>
                  <p className="text-sm text-muted-foreground">{patient.hmo.provider}</p>
                </div>
              )}

              {patient.corporateClient && (
                <div>
                  <p className="text-xs text-muted-foreground">Corporate Client</p>
                  <p className="font-medium">{patient.corporateClient.companyName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{patient.contactInfo?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{patient.contactInfo?.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-medium">{patient.address || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Emergency Contact</p>
                <p className="font-medium text-sm">{patient.emergencyContact || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History & Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href={`/medical-records/new?patientId=${patient.id}`}>
              <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                <FileText className="w-6 h-6 mx-auto mb-2 text-tory-blue" />
                <p className="text-sm font-medium">Add Record</p>
              </button>
            </Link>
            <Link href={`/prescriptions/new?patientId=${patient.id}`}>
              <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                <Pill className="w-6 h-6 mx-auto mb-2 text-tory-blue" />
                <p className="text-sm font-medium">Prescribe</p>
              </button>
            </Link>
            <Link href={`/lab-orders/new?patientId=${patient.id}`}>
              <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                <TestTube className="w-6 h-6 mx-auto mb-2 text-tory-blue" />
                <p className="text-sm font-medium">Lab Order</p>
              </button>
            </Link>
            <Link href={`/billing/new?patientId=${patient.id}`}>
              <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-tory-blue" />
                <p className="text-sm font-medium">Create Invoice</p>
              </button>
            </Link>
          </div>

          {/* Appointments */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Appointments
            </h3>
            {patient.appointments && patient.appointments.length > 0 ? (
              <div className="space-y-2">
                {patient.appointments.map((apt: any) => (
                  <div key={apt.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{apt.appointmentType}</p>
                        <p className="text-xs text-muted-foreground">
                          Dr. {apt.doctor?.name} • {apt.department}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(apt.startTime).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          apt.status === 'completed'
                            ? 'bg-green-haze/10 text-green-haze'
                            : apt.status === 'scheduled'
                            ? 'bg-tory-blue/10 text-tory-blue'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No appointments yet</p>
            )}
          </div>

          {/* Medical Records */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Medical Records
            </h3>
            {patient.medicalRecords && patient.medicalRecords.length > 0 ? (
              <div className="space-y-2">
                {patient.medicalRecords.map((record: any) => (
                  <div key={record.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{record.diagnosis || 'No diagnosis'}</p>
                        <p className="text-xs text-muted-foreground">
                          Dr. {record.doctor?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(record.visitDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No medical records yet</p>
            )}
          </div>

          {/* Prescriptions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Prescriptions
            </h3>
            {patient.prescriptions && patient.prescriptions.length > 0 ? (
              <div className="space-y-2">
                {patient.prescriptions.map((prescription: any) => (
                  <div key={prescription.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {prescription.prescriptionItems?.length || 0} medications
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dr. {prescription.doctor?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          prescription.status === 'active'
                            ? 'bg-green-haze/10 text-green-haze'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {prescription.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No prescriptions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
