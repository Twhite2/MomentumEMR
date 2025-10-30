'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Button, Select } from '@momentum/ui';
import { Plus, Calendar, Clock, User } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

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
    patientType: string;
  };
  doctor: {
    id: number;
    name: string;
  };
}

interface AppointmentsResponse {
  appointments: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  
  // Check if user can create appointments (admin, nurse, or receptionist)
  const canCreateAppointments = ['admin', 'nurse', 'receptionist'].includes(session?.user?.role || '');

  const { data, isLoading, error } = useQuery<AppointmentsResponse>({
    queryKey: ['appointments', status, date, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (status) params.append('status', status);
      if (date) params.append('date', date);

      const response = await axios.get(`/api/appointments?${params}`);
      return response.data;
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

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'OPD':
        return 'bg-primary/10 text-primary';
      case 'IPD':
        return 'bg-danube/10 text-danube';
      case 'surgery':
        return 'bg-red-ribbon/10 text-red-ribbon';
      case 'lab':
        return 'bg-green-haze/10 text-green-haze';
      case 'follow_up':
        return 'bg-saffron/10 text-saffron';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage patient appointments and schedules</p>
        </div>
        {canCreateAppointments && (
          <Link href="/appointments/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
          />

          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="checked_in">Checked In</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          {(date || status) && (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setDate('');
                setStatus('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load appointments</p>
          </div>
        ) : data?.appointments.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No appointments found</p>
            <Link href="/appointments/new">
              <Button variant="primary" size="sm" className="mt-4">
                Book First Appointment
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/appointments/${appointment.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Dr. {appointment.doctor.name}
                            {appointment.department && ` • ${appointment.department}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 ml-15 mt-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(appointment.startTime)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatTime(appointment.startTime)}
                          {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getAppointmentTypeColor(
                          appointment.appointmentType
                        )}`}
                      >
                        {appointment.appointmentType === 'follow_up'
                          ? 'FOLLOW UP'
                          : appointment.appointmentType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to{' '}
                  {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}{' '}
                  appointments
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

