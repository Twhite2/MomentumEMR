'use client';

import { StatCard } from './stat-card';
import { Calendar, TestTube, UserCheck, FileText, Pill, Clock } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface DoctorDashboardProps {
  session: Session;
}

export default function DoctorDashboard({ session }: DoctorDashboardProps) {
  // Fetch dashboard statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/stats');
      return response.data;
    },
  });

  // Fetch appointments data for list view
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments-dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/appointments?limit=100');
      return response.data;
    },
  });

  // Calculate today's appointments for list view
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = appointmentsData?.appointments?.filter((apt: any) => {
    const aptDate = new Date(apt.startTime);
    return aptDate >= today && aptDate < tomorrow;
  }) || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-green-haze/10 text-green-haze';
      case 'checked_in':
        return 'bg-saffron/10 text-saffron';
      case 'in_progress':
        return 'bg-primary/10 text-primary';
      case 'completed':
        return 'bg-green-600/10 text-green-600';
      default:
        return 'bg-spindle text-primary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Good morning, {session.user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Doctor Dashboard - {session.user.hospitalName}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/appointments">
          <StatCard
            title="Today's Appointments"
            value={isLoading ? '...' : (stats?.todayAppointments || 0)}
            icon={Calendar}
            color="blue"
          />
        </Link>
        <Link href="/lab-orders">
          <StatCard
            title="Pending Lab Orders"
            value={isLoading ? '...' : (stats?.pendingLabOrders || 0)}
            icon={TestTube}
            color="yellow"
          />
        </Link>
        <Link href="/patients">
          <StatCard
            title="Total Patients"
            value={isLoading ? '...' : (stats?.totalPatients || 0)}
            icon={UserCheck}
            color="purple"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Today's Schedule</h2>
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
            ) : todayAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No appointments scheduled for today</p>
              </div>
            ) : (
              todayAppointments.slice(0, 5).map((apt: any) => (
                <Link key={apt.id} href={`/appointments/${apt.id}`}>
                  <div className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-spindle/30 transition-colors cursor-pointer">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">
                          {apt.patient?.firstName} {apt.patient?.lastName}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(apt.status)}`}>
                          {apt.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {apt.appointmentType || apt.department} • {formatTime(apt.startTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Patient ID: P-{apt.patient?.id.toString().padStart(6, '0')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/lab-orders" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center">
              <TestTube className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Lab Orders</p>
            </Link>
            <Link href="/prescriptions" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center">
              <Pill className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Prescriptions</p>
            </Link>
            <Link href="/medical-records" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center">
              <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Records</p>
            </Link>
            <Link href="/patients" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center">
              <UserCheck className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">My Patients</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Pending Appointments</p>
            <p className="text-2xl font-bold text-tory-blue">{stats?.pendingAppointments || 0}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Completed Today</p>
            <p className="text-2xl font-bold text-green-haze">{stats?.completedToday || 0}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Active Prescriptions</p>
            <p className="text-2xl font-bold text-purple-600">{stats?.activePrescriptions || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

