'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@momentum/ui';
import { ArrowLeft, Edit, Calendar, FileText, Pill, TestTube, DollarSign, User, BedDouble, Activity } from 'lucide-react';
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
  primaryDoctor?: {
    id: number;
    name: string;
    email: string;
  };
  hmo?: {
    id: number;
    name: string;
    policyName?: string;
    provider?: string;
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
  vitals?: any[];
  createdAt: string;
}

export default function PatientDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const patientId = params.id as string;

  // Role-based permissions
  const userRole = session?.user?.role;
  const isNurse = userRole === 'nurse';
  const isReceptionist = userRole === 'receptionist';
  const isDoctor = userRole === 'doctor';
  const canPrescribe = isDoctor; // Only doctors can prescribe
  const canOrderLabs = isDoctor; // Only doctors can order lab tests
  const canCreateMedicalRecords = !isNurse && !isReceptionist; // Nurses and receptionists cannot create medical records
  const canCreateInvoices = ['admin', 'receptionist'].includes(userRole || ''); // Only admins/receptionists handle billing
  const canEditPatient = ['admin', 'receptionist'].includes(userRole || ''); // Only admin/receptionist can edit patient info

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
        return 'bg-primary/10 text-primary';
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
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
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
          {canEditPatient && (
            <Link href={`/patients/${patient.id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
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
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
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

              {patient.primaryDoctor && (
                <div>
                  <p className="text-xs text-muted-foreground">Primary Doctor</p>
                  <p className="font-medium">{patient.primaryDoctor.name}</p>
                  <p className="text-sm text-muted-foreground">{patient.primaryDoctor.email}</p>
                </div>
              )}

              {patient.hmo && (
                <div>
                  <p className="text-xs text-muted-foreground">HMO Coverage</p>
                  <p className="font-medium">{patient.hmo.name}</p>
                  {patient.hmo.policyName && (
                    <p className="text-sm text-muted-foreground">{patient.hmo.policyName}</p>
                  )}
                  {patient.hmo.provider && (
                    <p className="text-sm text-muted-foreground">{patient.hmo.provider}</p>
                  )}
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
          {/* Quick Actions - Role-based */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Only doctors and admins can add medical records */}
            {canCreateMedicalRecords && (
              <Link href={`/medical-records/new?patientId=${patient.id}`}>
                <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Add Record</p>
                </button>
              </Link>
            )}

            {/* Only nurses can add nursing notes */}
            {isNurse && (
              <Link href={`/nursing-notes/new?patientId=${patient.id}`}>
                <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Add Nursing Notes</p>
                </button>
              </Link>
            )}

            {/* Only nurses can add vitals */}
            {isNurse && (
              <Link href={`/vitals/new?patientId=${patient.id}`}>
                <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Add Vitals</p>
                </button>
              </Link>
            )}
            
            {/* Only doctors can prescribe */}
            {canPrescribe && (
              <Link href={`/prescriptions/new?patientId=${patient.id}`}>
                <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                  <Pill className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Prescribe</p>
                </button>
              </Link>
            )}
            
            {/* Only doctors can order lab tests */}
            {canOrderLabs && (
              <Link href={`/lab-orders/new?patientId=${patient.id}`}>
                <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                  <TestTube className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Lab Order</p>
                </button>
              </Link>
            )}
            
            {/* Only admins/receptionists can create invoices */}
            {canCreateInvoices && (
              <Link href={`/invoices/new?patientId=${patient.id}`}>
                <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Create Invoice</p>
                </button>
              </Link>
            )}
            
            {/* Only admins/nurses can admit patients */}
            {canCreateMedicalRecords && patient.patientType !== 'inpatient' && (
              <Link href={`/admissions/new?patientId=${patient.id}`}>
                <button className="w-full p-4 bg-white border border-border rounded-lg hover:bg-spindle transition-colors text-center">
                  <BedDouble className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Admit Patient</p>
                </button>
              </Link>
            )}
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
                  <Link key={apt.id} href={`/appointments/${apt.id}`}>
                    <div className="p-3 border rounded-lg hover:bg-spindle hover:border-primary transition-all cursor-pointer">
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
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No appointments yet</p>
            )}
          </div>

          {/* Medical Records - Hidden from receptionists */}
          {!isReceptionist && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Medical Records
              </h3>
              {patient.medicalRecords && patient.medicalRecords.length > 0 ? (
                <div className="space-y-2">
                  {patient.medicalRecords.map((record: any) => (
                    <Link key={record.id} href={`/medical-records/${record.id}`}>
                      <div className="p-3 border rounded-lg hover:bg-spindle hover:border-primary transition-all cursor-pointer">
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
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No medical records yet</p>
              )}
            </div>
          )}

          {/* Prescriptions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Prescriptions
            </h3>
            {patient.prescriptions && patient.prescriptions.length > 0 ? (
              <div className="space-y-2">
                {patient.prescriptions.map((prescription: any) => (
                  <Link key={prescription.id} href={`/prescriptions/${prescription.id}`}>
                    <div className="p-3 border rounded-lg hover:bg-spindle hover:border-primary transition-all cursor-pointer">
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
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No prescriptions yet</p>
            )}
          </div>

          {/* Lab Orders */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Lab Orders
            </h3>
            {patient.labOrders && patient.labOrders.length > 0 ? (
              <div className="space-y-2">
                {patient.labOrders.map((labOrder: any) => (
                  <Link key={labOrder.id} href={`/lab-orders/${labOrder.id}`}>
                    <div className="p-3 border rounded-lg hover:bg-spindle hover:border-primary transition-all cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{labOrder.orderType}</p>
                          {labOrder.description && (
                            <p className="text-xs text-muted-foreground">{labOrder.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(labOrder.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            labOrder.status === 'completed'
                              ? 'bg-green-haze/10 text-green-haze'
                              : labOrder.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-tory-blue/10 text-tory-blue'
                          }`}
                        >
                          {labOrder.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No lab orders yet</p>
            )}
          </div>

          {/* Vitals */}
          <div id="vitals" className="bg-white rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Vitals
            </h3>
            {patient.vitals && patient.vitals.length > 0 ? (
              <div className="space-y-2">
                {patient.vitals.map((vital: any) => (
                  <div key={vital.id} className="p-3 border rounded-lg hover:bg-spindle transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-xs text-muted-foreground">
                        {new Date(vital.recordedAt).toLocaleDateString()} at {new Date(vital.recordedAt).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-muted-foreground">By: {vital.recordedByUser?.name}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {vital.bloodPressure && (
                        <div>
                          <p className="text-xs text-muted-foreground">Blood Pressure</p>
                          <p className="text-sm font-medium">{vital.bloodPressure} mmHg</p>
                        </div>
                      )}
                      {vital.heartRate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Heart Rate</p>
                          <p className="text-sm font-medium">{vital.heartRate} bpm</p>
                        </div>
                      )}
                      {vital.temperature && (
                        <div>
                          <p className="text-xs text-muted-foreground">Temperature</p>
                          <p className="text-sm font-medium">{vital.temperature}°C</p>
                        </div>
                      )}
                      {vital.oxygenSaturation && (
                        <div>
                          <p className="text-xs text-muted-foreground">SpO2</p>
                          <p className="text-sm font-medium">{vital.oxygenSaturation}%</p>
                        </div>
                      )}
                      {vital.respiratoryRate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Resp. Rate</p>
                          <p className="text-sm font-medium">{vital.respiratoryRate} /min</p>
                        </div>
                      )}
                      {vital.weight && (
                        <div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-sm font-medium">{vital.weight} kg</p>
                        </div>
                      )}
                      {vital.height && (
                        <div>
                          <p className="text-xs text-muted-foreground">Height</p>
                          <p className="text-sm font-medium">{vital.height} cm</p>
                        </div>
                      )}
                      {vital.bmi && (
                        <div>
                          <p className="text-xs text-muted-foreground">BMI</p>
                          <p className="text-sm font-medium">{vital.bmi}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No vitals recorded yet</p>
            )}
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Invoices
            </h3>
            {patient.invoices && patient.invoices.length > 0 ? (
              <div className="space-y-2">
                {patient.invoices.map((invoice: any) => (
                  <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                    <div className="p-3 border rounded-lg hover:bg-spindle hover:border-primary transition-all cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">Invoice #{invoice.id.toString().padStart(6, '0')}</p>
                          <p className="text-xs text-muted-foreground">
                            ₦{invoice.totalAmount?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-green-haze/10 text-green-haze'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-red-ribbon/10 text-red-ribbon'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No invoices yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
