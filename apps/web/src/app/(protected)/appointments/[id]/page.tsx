'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@momentum/ui';
import { ArrowLeft, Edit, Calendar, Clock, User, MapPin, CheckCircle, XCircle, Activity } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Appointment {
  id: number;
  appointmentType: string;
  status: string;
  startTime: string;
  endTime: string | null;
  department: string | null;
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
}

export default function AppointmentDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const appointmentId = params.id as string;
  
  // Check if user is patient
  const isPatient = session?.user?.role === 'patient';
  const isNurse = session?.user?.role === 'nurse';
  const canManageAppointments = ['admin', 'doctor', 'nurse', 'receptionist'].includes(session?.user?.role || '');
  const canCreateMedicalRecords = ['admin', 'doctor'].includes(session?.user?.role || '');

  const { data: appointment, isLoading, error } = useQuery<Appointment>({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const response = await axios.get(`/api/appointments/${appointmentId}`);
      return response.data;
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const response = await axios.put(`/api/appointments/${appointmentId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Appointment status updated');
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Cancel appointment mutation
  const cancelAppointment = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`/api/appointments/${appointmentId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Appointment cancelled');
      router.push('/appointments');
    },
    onError: () => {
      toast.error('Failed to cancel appointment');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-primary/10 text-primary';
      case 'checked_in':
        return 'bg-saffron/10 text-saffron';
      case 'completed':
        return 'bg-green-haze/10 text-green-haze';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-ribbon mb-4">Failed to load appointment</p>
          <Link href="/appointments">
            <Button variant="outline">Back to Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDateTime = formatDateTime(appointment.startTime);
  const endDateTime = appointment.endTime ? formatDateTime(appointment.endTime) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/appointments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Appointment Details</h1>
            <p className="text-muted-foreground mt-1">
              Appointment #{appointment.id}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(appointment.status)}`}>
          {appointment.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule Card */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Schedule
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{startDateTime.date}</p>
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {startDateTime.time}
                    {endDateTime && ` - ${endDateTime.time}`}
                  </p>
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
              </div>
              {appointment.department && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{appointment.department}</p>
                    <p className="text-sm text-muted-foreground">Department</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {appointment.patient.firstName.charAt(0)}
                  {appointment.patient.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {calculateAge(appointment.patient.dob)} years • {appointment.patient.gender}
                </p>
                <div className="mt-3 space-y-1">
                  {appointment.patient.contactInfo?.phone && (
                    <p className="text-sm">📞 {appointment.patient.contactInfo.phone}</p>
                  )}
                  {appointment.patient.contactInfo?.email && (
                    <p className="text-sm">✉️ {appointment.patient.contactInfo.email}</p>
                  )}
                </div>
                <Link href={`/patients/${appointment.patient.id}`}>
                  <Button variant="ghost" size="sm" className="mt-3">
                    View Patient Profile →
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Assigned Doctor</h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-danube/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-danube" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Dr. {appointment.doctor.name}</h3>
                <p className="text-sm text-muted-foreground">{appointment.doctor.email}</p>
                {appointment.department && (
                  <p className="text-sm text-muted-foreground mt-1">{appointment.department}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {!isPatient && appointment.status === 'scheduled' && (
                <>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => updateStatus.mutate('checked_in')}
                    loading={updateStatus.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Check In Patient
                  </Button>
                </>
              )}

              {/* Patients can cancel their own appointments */}
              {appointment.status === 'scheduled' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this appointment?')) {
                      cancelAppointment.mutate();
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Appointment
                </Button>
              )}

              {!isPatient && appointment.status === 'checked_in' && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => updateStatus.mutate('completed')}
                  loading={updateStatus.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
              )}

              {/* Doctors/Admins: Add Medical Record */}
              {canCreateMedicalRecords && appointment.status !== 'cancelled' && (
                <Link href={`/medical-records/new?patientId=${appointment.patient.id}&appointmentId=${appointment.id}`}>
                  <Button variant="outline" className="w-full">
                    Add Medical Record
                  </Button>
                </Link>
              )}

              {/* Nurses: Add Nursing Notes */}
              {isNurse && appointment.status !== 'cancelled' && (
                <Link href={`/nursing-notes/new?patientId=${appointment.patient.id}&appointmentId=${appointment.id}`}>
                  <Button variant="outline" className="w-full">
                    Add Nursing Notes
                  </Button>
                </Link>
              )}

              {/* Nurses: Add Vitals */}
              {isNurse && appointment.status !== 'cancelled' && (
                <Link href={`/vitals/new?patientId=${appointment.patient.id}&appointmentId=${appointment.id}`}>
                  <Button variant="outline" className="w-full">
                    <Activity className="w-4 h-4 mr-2" />
                    Add Vitals
                  </Button>
                </Link>
              )}
              
              {/* Show helpful message if no actions available */}
              {isPatient && appointment.status !== 'scheduled' && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No actions available for this appointment
                </p>
              )}
            </div>
          </div>

          {/* Appointment Type */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Appointment Type</h2>
            <div className="text-center">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                {appointment.appointmentType === 'follow_up'
                  ? 'FOLLOW UP'
                  : appointment.appointmentType.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Metadata</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(appointment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Patient Type</p>
                <p className="font-medium capitalize">{appointment.patient.patientType.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
