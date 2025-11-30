'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@momentum/ui';
import { ArrowLeft, Edit, Calendar, User, FileText, Stethoscope, Download, ExternalLink, Activity, AlertTriangle, Pill, ClipboardList, TestTube, FileSearch, History, Bell, Hospital } from 'lucide-react';
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
  // Show enhanced dashboard for all users
  const showEnhancedDashboard = true;

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

  // Enhanced Dashboard View for All Users (Doctors, Nurses, Pharmacists, Lab Techs)
  if (showEnhancedDashboard) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Patient Name & ID */}
          <div className="bg-white border-2 border-tory-blue rounded-lg p-4 md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-bold text-tory-blue">{record.patient.firstName} {record.patient.lastName}</h3>
            <p className="text-xs text-muted-foreground mt-1">ID: {record.patient.id}</p>
          </div>

          {/* Biodata & Total Visits */}
          <div className="bg-white border-2 border-tory-blue rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold mb-1 text-tory-blue">Biodata</h4>
                <p className="text-sm text-foreground">{calculateAge(record.patient.dob)} yrs • {record.patient.gender}</p>
                {record.patient.tribe && <p className="text-xs text-muted-foreground">{record.patient.tribe}</p>}
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-tory-blue">Total Visits</p>
                <p className="text-xl font-bold text-foreground">{record.patient._count?.medicalRecords || 1}</p>
              </div>
            </div>
          </div>

          {/* Status & Vital Signs */}
          <div className="bg-white border-2 border-tory-blue rounded-lg p-4">
            <div className="space-y-3">
              <div className="text-center pb-3 border-b border-border">
                <p className="text-xs font-semibold text-tory-blue">Status</p>
                <p className="text-lg font-bold text-foreground">{record.patient.patientType === 'inpatient' ? 'ADMITTED' : 'OPD'}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-2 text-tory-blue">Vital Signs</h4>
                {record.latestVital ? (
                  <div className="space-y-1 text-xs text-foreground">
                    <p>BP: {record.latestVital.bloodPressure}</p>
                    <p>Temp: {record.latestVital.temperature}°C</p>
                    <p>Pulse: {record.latestVital.pulse} bpm</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No vitals recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-white border-2 border-tory-blue rounded-lg p-4">
            <h4 className="text-xs font-semibold mb-2 text-tory-blue">Allergies</h4>
            <p className="text-sm text-foreground">{record.patient.allergies || 'None recorded'}</p>
          </div>
        </div>

        {/* Clinical Documentation & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Clinical Documentation */}
          <div className="lg:col-span-2 space-y-4">
            {/* Clinical Notes */}
            <Link href={`/medical-records/${record.id}/edit`}>
              <div className="bg-white border border-border rounded-lg p-5 hover:border-tory-blue hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-tory-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-tory-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">Clinical notes</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {record.notes || 'No clinical notes yet. Click to add.'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Diagnosis */}
            <Link href={`/medical-records/${record.id}/edit`}>
              <div className="bg-white border border-border rounded-lg p-5 hover:border-tory-blue hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-tory-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-tory-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">Diagnosis (differentials)</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {record.diagnosis || 'No diagnosis recorded yet. Click to add.'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Treatment Plan */}
            <Link href={`/medical-records/${record.id}/edit`}>
              <div className="bg-white border border-border rounded-lg p-5 hover:border-green-haze hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-haze/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileSearch className="w-5 h-5 text-green-haze" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">Treatment plan</h3>
                    <p className="text-xs text-muted-foreground mb-1">Nurses have edit access</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {record.treatmentPlan || 'No treatment plan recorded yet.'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Vitals & Clinical History */}
            <Link href={`/vitals?patientId=${record.patient.id}`}>
              <div className="bg-white border border-border rounded-lg p-5 hover:border-tory-blue hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-tory-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-tory-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">Vitals & Clinical History</h3>
                    <p className="text-sm text-muted-foreground">
                      View all recorded vital signs and measurements
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Complete Patient Profile */}
            <Link href={`/patients/${record.patient.id}`}>
              <div className="bg-white border border-border rounded-lg p-5 hover:border-tory-blue hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-tory-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-tory-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">Complete Patient Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      View full medical history and patient information
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-4">
            {/* Prescribe Drugs */}
            <Link href={`/prescriptions/new?patientId=${record.patient.id}`}>
              <div className="bg-white border border-border rounded-lg p-5 hover:border-red-ribbon hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-red-ribbon/10 rounded-lg flex items-center justify-center">
                    <Pill className="w-5 h-5 text-red-ribbon" />
                  </div>
                  <Bell className="w-4 h-4 text-red-ribbon" />
                </div>
                <h3 className="font-semibold text-base mb-1">Prescribe drugs</h3>
                <p className="text-xs text-muted-foreground">Create new prescription</p>
              </div>
            </Link>

            {/* Order Test */}
            <Link href={`/lab-orders/new?patientId=${record.patient.id}`}>
              <div className="bg-white border border-border rounded-lg p-5 hover:border-green-haze hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-green-haze/10 rounded-lg flex items-center justify-center">
                    <TestTube className="w-5 h-5 text-green-haze" />
                  </div>
                  <Bell className="w-4 h-4 text-green-haze" />
                </div>
                <h3 className="font-semibold text-base mb-1">Order lab test</h3>
                <p className="text-xs text-muted-foreground">Create new lab order</p>
              </div>
            </Link>

            {/* Admit Patient */}
            {record.patient.patientType !== 'inpatient' && (
              <Link href={`/admissions/new?patientId=${record.patient.id}`}>
                <div className="bg-white border border-border rounded-lg p-5 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                      <Hospital className="w-5 h-5 text-amber-500" />
                    </div>
                    <Bell className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-base mb-1">Admit patient</h3>
                  <p className="text-xs text-muted-foreground">Admit for inpatient care</p>
                </div>
              </Link>
            )}

            {/* Previous Prescriptions */}
            <Link href={`/prescriptions?patientId=${record.patient.id}`}>
              <div className="bg-white border border-border rounded-lg p-5 hover:border-tory-blue hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-tory-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-tory-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">Previous prescriptions</h3>
                    <p className="text-xs text-muted-foreground">
                      {record.patient._count?.prescriptions || 0} prescription(s)
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Previous Lab Orders */}
            <Link href={`/lab-orders?patientId=${record.patient.id}`}>
              <div className="bg-white border border-border rounded-lg p-5 hover:border-tory-blue hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-tory-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <History className="w-5 h-5 text-tory-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">Previous lab orders</h3>
                    <p className="text-xs text-muted-foreground">
                      {record.patient._count?.labOrders || 0} lab order(s)
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
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
