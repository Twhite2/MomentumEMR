'use client';

import { StatCard } from './stat-card';
import { Calendar, UserCheck, Pill, ClipboardCheck, Clock, AlertCircle, Users, Activity } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface NurseDashboardProps {
  session: Session;
}

export default function NurseDashboard({ session }: NurseDashboardProps) {
  // Fetch dashboard statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/stats');
      return response.data;
    },
  });

  // Fetch today's appointments for check-in
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`/api/appointments?date=${today}`);
      return response.data;
    },
  });

  // Fetch active prescriptions for medication rounds
  const { data: prescriptionsData, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['active-prescriptions'],
    queryFn: async () => {
      const response = await axios.get('/api/prescriptions?status=active&limit=10');
      return response.data;
    },
  });

  // Calculate today's appointment statuses
  const scheduledAppointments = appointmentsData?.appointments?.filter(
    (apt: any) => apt.status === 'scheduled'
  ) || [];
  
  const checkedInAppointments = appointmentsData?.appointments?.filter(
    (apt: any) => apt.status === 'checked_in'
  ) || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 border-blue-200';
      case 'checked_in':
        return 'bg-green-50 border-green-200';
      case 'completed':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground mt-1">Nurse Dashboard</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link href="/appointments">
          <StatCard 
            title="Today's Appointments" 
            value={isLoading ? '...' : (stats?.todayAppointments || 0)} 
            icon={Calendar} 
            color="blue" 
          />
        </Link>
        <Link href="/appointments">
          <StatCard 
            title="Checked In" 
            value={isLoading ? '...' : (stats?.checkedInToday || 0)} 
            icon={UserCheck} 
            color="green" 
          />
        </Link>
        <Link href="/appointments">
          <StatCard 
            title="Pending Check-In" 
            value={isLoading ? '...' : (stats?.pendingCheckIn || 0)} 
            icon={Clock} 
            color="yellow" 
          />
        </Link>
        <Link href="/prescriptions">
          <StatCard 
            title="Active Medications" 
            value={isLoading ? '...' : (stats?.activeMedications || 0)} 
            icon={Pill} 
            color="purple" 
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patients Pending Check-In */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-saffron" />
              Patients to Check In
            </h2>
            <Link href="/appointments" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {appointmentsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading appointments...</p>
              </div>
            ) : scheduledAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">All patients checked in!</p>
              </div>
            ) : (
              scheduledAppointments.slice(0, 5).map((apt: any) => (
                <Link key={apt.id} href={`/appointments/${apt.id}`}>
                  <div className={`p-3 border rounded-lg hover:shadow-sm transition-shadow ${getAppointmentStatusColor(apt.status)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {apt.patient?.firstName} {apt.patient?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(apt.startTime)} • Dr. {apt.doctor?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {apt.appointmentType} • {apt.department}
                        </p>
                      </div>
                      <button className="px-3 py-1 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90">
                        Check In
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Checked In - Waiting for Doctor */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-haze" />
              Waiting for Doctor
            </h2>
            <Link href="/appointments" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {appointmentsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : checkedInAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No patients waiting</p>
              </div>
            ) : (
              checkedInAppointments.slice(0, 5).map((apt: any) => {
                const checkedInTime = new Date(apt.updatedAt);
                const waitTime = Math.floor((Date.now() - checkedInTime.getTime()) / 60000); // minutes
                const isLongWait = waitTime > 30;
                
                return (
                  <Link key={apt.id} href={`/appointments/${apt.id}`}>
                    <div className={`p-3 border rounded-lg hover:shadow-sm transition-shadow ${
                      isLongWait ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {apt.patient?.firstName} {apt.patient?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Checked in {waitTime} min ago • Dr. {apt.doctor?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {apt.appointmentType}
                          </p>
                        </div>
                        {isLongWait && (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Active Medications / Prescriptions */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Pill className="w-5 h-5 text-purple-600" />
            Active Medications to Administer
          </h2>
          <Link href="/prescriptions" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prescriptionsLoading ? (
            <div className="col-span-3 p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading prescriptions...</p>
            </div>
          ) : !prescriptionsData?.prescriptions || prescriptionsData.prescriptions.length === 0 ? (
            <div className="col-span-3 p-8 text-center">
              <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">No active medications</p>
            </div>
          ) : (
            prescriptionsData.prescriptions.slice(0, 6).map((rx: any) => (
              <Link key={rx.id} href={`/prescriptions/${rx.id}`}>
                <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg hover:shadow-sm transition-shadow">
                  <p className="font-medium text-sm text-foreground">
                    {rx.patient?.firstName} {rx.patient?.lastName}
                  </p>
                  <p className="text-xs text-purple-900 font-medium mt-2">
                    {rx.medication}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rx.dosage} • {rx.frequency}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Duration: {rx.duration}
                  </p>
                  <div className="mt-2 pt-2 border-t border-purple-200">
                    <p className="text-xs text-purple-700">
                      Dr. {rx.doctor?.name}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/appointments" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">View Schedule</p>
          </Link>
          <Link href="/patients" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Patient List</p>
          </Link>
          <Link href="/medical-records/new" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center">
            <ClipboardCheck className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Add Note</p>
          </Link>
          <Link href="/prescriptions" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center">
            <Pill className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Medications</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
