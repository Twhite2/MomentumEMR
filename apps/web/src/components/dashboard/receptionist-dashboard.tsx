'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Users, Calendar, Clock, DollarSign, UserCheck, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@momentum/ui';

export default function ReceptionistDashboard() {
  // Fetch today's appointments
  const { data: appointmentsData } = useQuery({
    queryKey: ['dashboard-appointments'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`/api/appointments?date=${today}&limit=100`);
      return response.data;
    },
  });

  // Fetch patient queue
  const { data: queueData } = useQuery({
    queryKey: ['dashboard-queue'],
    queryFn: async () => {
      const response = await axios.get('/api/patient-queue');
      return response.data;
    },
  });

  // Calculate statistics
  const todayAppointments = appointmentsData?.appointments?.length || 0;
  const waitingPatients = queueData?.stats?.waiting || 0;
  const inProgress = queueData?.stats?.inProgress || 0;
  const completed = queueData?.stats?.completed || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Front Desk Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage patient check-ins, appointments, and billing
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Appointments</p>
              <p className="text-3xl font-bold text-tory-blue mt-1">{todayAppointments}</p>
            </div>
            <Calendar className="w-10 h-10 text-tory-blue/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Waiting Patients</p>
              <p className="text-3xl font-bold text-saffron mt-1">{waitingPatients}</p>
            </div>
            <Clock className="w-10 h-10 text-saffron/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold text-danube mt-1">{inProgress}</p>
            </div>
            <UserCheck className="w-10 h-10 text-danube/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <p className="text-3xl font-bold text-green-haze mt-1">{completed}</p>
            </div>
            <ClipboardList className="w-10 h-10 text-green-haze/20" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/patients/new">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              <span className="text-sm">Register Patient</span>
            </Button>
          </Link>

          <Link href="/appointments/new">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Book Appointment</span>
            </Button>
          </Link>

          <Link href="/patient-queue">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
              <UserCheck className="w-6 h-6" />
              <span className="text-sm">Patient Queue</span>
            </Button>
          </Link>

          <Link href="/billing">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
              <DollarSign className="w-6 h-6" />
              <span className="text-sm">Billing</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Today's Appointments</h2>
          <Link href="/appointments">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {appointmentsData?.appointments && appointmentsData.appointments.length > 0 ? (
          <div className="space-y-3">
            {appointmentsData.appointments.slice(0, 5).map((appointment: any) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-spindle transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-tory-blue rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {appointment.patient.firstName[0]}{appointment.patient.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} - Dr. {appointment.doctor.name}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'confirmed'
                      ? 'bg-green-haze/10 text-green-haze'
                      : appointment.status === 'in_progress'
                      ? 'bg-danube/10 text-danube'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {appointment.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No appointments scheduled for today</p>
          </div>
        )}
      </div>
    </div>
  );
}
