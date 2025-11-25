'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@momentum/ui';
import { ArrowLeft, Edit, Calendar, User, FileText, Stethoscope, Download, ExternalLink, Activity, AlertTriangle, Pill, ClipboardList, TestTube, FileSearch, History, Bell } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useParams } from 'next/navigation';

interface MedicalRecord {
  id: number;
  visitDate: string;
  diagnosis: string | null;
  notes: string | null;
  treatmentPlan: string | null;
  attachments: any;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    tribe?: string;
    patientType: string;
    contactInfo: {
      phone?: string;
      email?: string;
    };
    allergies?: string;
    _count?: {
      medicalRecords: number;
      prescriptions: number;
      labOrders: number;
      vitals: number;
    };
  };
  doctor: {
    id: number;
    name: string;
    email: string;
  };
  latestVital?: {
    bloodPressure: string;
    temperature: number;
    pulse: number;
    weight: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function MedicalRecordDetailPage() {
  const params = useParams();
  const recordId = params.id as string;
  const { data: session } = useSession();
  const isLabTech = session?.user?.role === 'lab_tech';
  const isDoctor = session?.user?.role === 'doctor' || session?.user?.role === 'admin';
  const isNurse = session?.user?.role === 'nurse';

  const { data: record, isLoading, error } = useQuery<MedicalRecord>({
    queryKey: ['medical-record', recordId],
    queryFn: async () => {
      const response = await axios.get(`/api/medical-records/${recordId}`);
      const data = response.data;
      
      // Parse attachments if they're stored as JSON string
      if (data.attachments && typeof data.attachments === 'string') {
        try {
          data.attachments = JSON.parse(data.attachments);
        } catch (e) {
          data.attachments = null;
        }
      }
      
      return data;
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

  // Enhanced Dashboard View for Doctors
  if (isDoctor) {
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
              <h1 className="text-3xl font-bold">Patient Dashboard</h1>
              <p className="text-muted-foreground mt-1">Comprehensive medical overview</p>
            </div>
          </div>
        </div>

        {/* Top Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Patient Name */}
          <div className="bg-tory-blue text-white rounded-lg p-4">
            <h3 className="text-lg font-bold">{record.patient.firstName} {record.patient.lastName}</h3>
            <p className="text-xs opacity-90 mt-1">
              {record.patient.id}
            </p>
          </div>

          {/* Biodata */}
          <div className="bg-tory-blue text-white rounded-lg p-4">
            <h4 className="text-xs font-semibold mb-2">Biodata</h4>
            <p className="text-sm">{calculateAge(record.patient.dob)} yrs • {record.patient.gender}</p>
            {record.patient.tribe && <p className="text-xs opacity-90">{record.patient.tribe}</p>}
          </div>

          {/* Admitted/OPD Status */}
          <div className="bg-tory-blue text-white rounded-lg p-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs font-semibold mb-1">Status</p>
              <p className="text-lg font-bold">{record.patient.patientType === 'inpatient' ? 'ADMITTED' : 'OPD'}</p>
            </div>
          </div>

          {/* Vital Signs Summary */}
          <div className="bg-tory-blue text-white rounded-lg p-4">
            <h4 className="text-xs font-semibold mb-2">Vital signs</h4>
            {record.latestVital ? (
              <div className="space-y-1 text-xs">
                <p>BP: {record.latestVital.bloodPressure}</p>
                <p>Temp: {record.latestVital.temperature}°C</p>
                <p>Pulse: {record.latestVital.pulse} bpm</p>
              </div>
            ) : (
              <p className="text-xs opacity-75">No vitals recorded</p>
            )}
          </div>

          {/* Allergies */}
          <div className="bg-tory-blue text-white rounded-lg p-4">
            <h4 className="text-xs font-semibold mb-2">Allergies</h4>
            <p className="text-sm">{record.patient.allergies || 'None recorded'}</p>
          </div>

          {/* Total Visits */}
          <div className="bg-tory-blue text-white rounded-lg p-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs font-semibold mb-1">Total visits</p>
              <p className="text-2xl font-bold">{record.patient._count?.medicalRecords || 1}</p>
            </div>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Clinical Notes - Pink */}
          <Link href={`/medical-records/${record.id}/edit`} className="block lg:col-span-2">
            <div className="bg-gradient-to-br from-red-ribbon to-red-ribbon/80 text-white rounded-lg p-6 h-full hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Clinical notes</h3>
              <p className="text-sm opacity-90 line-clamp-3">{record.notes || 'No clinical notes yet. Click to add.'}</p>
            </div>
          </Link>

          {/* Prescribe Drugs - Pink */}
          <Link href={`/prescriptions/new?patientId=${record.patient.id}`} className="block">
            <div className="bg-gradient-to-br from-red-ribbon to-red-ribbon/80 text-white rounded-lg p-6 h-full hover:shadow-lg transition-shadow cursor-pointer relative">
              <Pill className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-bold">Prescribe drugs</h3>
              <div className="absolute top-3 right-3">
                <Bell className="w-5 h-5" />
              </div>
              <p className="text-xs mt-2 opacity-75">Notification that it has been prescribed</p>
            </div>
          </Link>

          {/* Diagnosis (Differentials) - Pink */}
          <Link href={`/medical-records/${record.id}/edit`} className="block lg:col-span-2">
            <div className="bg-gradient-to-br from-red-ribbon to-red-ribbon/80 text-white rounded-lg p-6 h-full hover:shadow-lg transition-shadow cursor-pointer">
              <Stethoscope className="w-8 h-8 mb-3" />
              <h3 className="text-xl font-bold mb-2">Diagnosis (differentials)</h3>
              <p className="text-sm opacity-90 line-clamp-2">{record.diagnosis || 'No diagnosis recorded yet.'}</p>
            </div>
          </Link>

          {/* Previous Prescriptions - Pink */}
          <Link href={`/prescriptions?patientId=${record.patient.id}`} className="block">
            <div className="bg-gradient-to-br from-red-ribbon to-red-ribbon/80 text-white rounded-lg p-6 h-full hover:shadow-lg transition-shadow cursor-pointer">
              <ClipboardList className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-bold">Previous prescriptions</h3>
              <p className="text-xs mt-2 opacity-75">{record.patient._count?.prescriptions || 0} prescription(s)</p>
            </div>
          </Link>

          {/* Treatment Plan - Pink */}
          <Link href={`/medical-records/${record.id}/edit`} className="block lg:col-span-2">
            <div className="bg-gradient-to-br from-red-ribbon to-red-ribbon/80 text-white rounded-lg p-6 h-full hover:shadow-lg transition-shadow cursor-pointer">
              <FileSearch className="w-8 h-8 mb-3" />
              <h3 className="text-xl font-bold mb-2">Treatment plan. Nurse has access</h3>
              <p className="text-sm opacity-90 line-clamp-2">{record.treatmentPlan || 'No treatment plan recorded yet.'}</p>
            </div>
          </Link>

          {/* Order Test - Green */}
          <Link href={`/lab-orders/new?patientId=${record.patient.id}`} className="block">
            <div className="bg-gradient-to-br from-green-haze to-green-haze/80 text-white rounded-lg p-6 h-full hover:shadow-lg transition-shadow cursor-pointer relative">
              <TestTube className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-bold">Order test</h3>
              <div className="absolute top-3 right-3">
                <Bell className="w-5 h-5" />
              </div>
              <p className="text-xs mt-2 opacity-75">Notification that it has been ordered, see results</p>
            </div>
          </Link>

          {/* Previous Orders - Green */}
          <Link href={`/lab-orders?patientId=${record.patient.id}`} className="block">
            <div className="bg-gradient-to-br from-green-haze to-green-haze/80 text-white rounded-lg p-6 h-full hover:shadow-lg transition-shadow cursor-pointer">
              <History className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-bold">Previous orders</h3>
              <p className="text-xs mt-2 opacity-75">{record.patient._count?.labOrders || 0} lab order(s)</p>
            </div>
          </Link>

          {/* Previous Records 1 - Yellow */}
          <Link href={`/vitals?patientId=${record.patient.id}`} className="block lg:col-span-3">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Activity className="w-8 h-8 mb-3" />
              <h3 className="text-xl font-bold">Previous records following hospital visit</h3>
              <p className="text-sm opacity-90">View all vitals and clinical history</p>
            </div>
          </Link>

          {/* Previous Records 2 - Yellow */}
          <Link href={`/patients/${record.patient.id}`} className="block lg:col-span-3">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <User className="w-8 h-8 mb-3" />
              <h3 className="text-xl font-bold">Previous records following hospital visit</h3>
              <p className="text-sm opacity-90">Complete patient medical history</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Standard View for Non-Doctors
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
          {(isDoctor || isNurse) && (
            <Link href={`/medical-records/${record.id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
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
                  <p className="text-sm font-medium text-muted-foreground mb-2">{isLabTech ? "Lab Notes" : "Clinical Notes"}</p>
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
            {record.attachments && Array.isArray(record.attachments) && record.attachments.length > 0 ? (
              <div className="space-y-2">
                {record.attachments.map((file: any, index: number) => {
                  // Extract file key from URL for authenticated download
                  const getFileKey = (url: string) => {
                    try {
                      const urlObj = new URL(url);
                      const pathParts = urlObj.pathname.split('/');
                      const bucketIndex = pathParts.findIndex(part => part === 'emr-uploads');
                      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
                        return pathParts.slice(bucketIndex + 1).join('/');
                      }
                      return url;
                    } catch {
                      return url;
                    }
                  };

                  const fileKey = getFileKey(file.url);
                  const downloadUrl = `/api/files/download?key=${encodeURIComponent(fileKey)}&filename=${encodeURIComponent(file.name)}`;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-tory-blue flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-primary/10 rounded text-primary transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <a
                          href={downloadUrl}
                          className="p-2 hover:bg-green-haze/10 rounded text-green-haze transition-colors"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
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
              <Link href={`/lab-orders/new?patientId=${record.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Order Lab Test
                </Button>
              </Link>
              <Link href={`/prescriptions/new?patientId=${record.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Create Prescription
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
