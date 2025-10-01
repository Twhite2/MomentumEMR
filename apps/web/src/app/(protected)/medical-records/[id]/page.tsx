'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { ArrowLeft, Edit, Calendar, User, FileText, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useParams } from 'next/navigation';

interface MedicalRecord {
  id: number;
  visitDate: string;
  diagnosis: string | null;
  notes: string | null;
  attachments: any;
  patient: {
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
  };
  doctor: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function MedicalRecordDetailPage() {
  const params = useParams();
  const recordId = params.id as string;

  const { data: record, isLoading, error } = useQuery<MedicalRecord>({
    queryKey: ['medical-record', recordId],
    queryFn: async () => {
      const response = await axios.get(`/api/medical-records/${recordId}`);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-tory-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-ribbon mb-4">Failed to load medical record</p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/medical-records">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Medical Record</h1>
            <p className="text-muted-foreground mt-1">Record #{record.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/medical-records/${record.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visit Information */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-tory-blue" />
              Visit Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Visit Date</p>
                <p className="font-medium">{formatDate(record.visitDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recorded By</p>
                <p className="font-medium">Dr. {record.doctor.name}</p>
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-green-haze" />
              Clinical Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Diagnosis</p>
                <div className="p-4 bg-green-haze/5 border border-green-haze/20 rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">
                    {record.diagnosis || 'No diagnosis recorded'}
                  </p>
                </div>
              </div>

              {record.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Clinical Notes</p>
                  <div className="p-4 bg-muted/50 border border-border rounded-lg">
                    <p className="text-foreground whitespace-pre-wrap">{record.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-tory-blue" />
              Attachments
            </h2>
            {record.attachments && Object.keys(record.attachments).length > 0 ? (
              <div className="space-y-2">
                {/* TODO: Display attachments when file upload is implemented */}
                <p className="text-sm text-muted-foreground">Attachments will be displayed here</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No attachments</p>
              </div>
            )}
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
                  {record.patient.firstName.charAt(0)}
                  {record.patient.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {record.patient.firstName} {record.patient.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {calculateAge(record.patient.dob)} years • {record.patient.gender}
                </p>
              </div>
            </div>
            <Link href={`/patients/${record.patient.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <User className="w-4 h-4 mr-2" />
                View Patient Profile
              </Button>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href={`/prescriptions/new?patientId=${record.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Create Prescription
                </Button>
              </Link>
              <Link href={`/lab-orders/new?patientId=${record.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Order Lab Test
                </Button>
              </Link>
              <Link href={`/appointments/new?patientId=${record.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Schedule Follow-up
                </Button>
              </Link>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Record Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDateTime(record.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDateTime(record.updatedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Patient Type</p>
                <p className="font-medium capitalize">
                  {record.patient.patientType.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
