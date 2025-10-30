'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@momentum/ui';
import { Clock, UserCheck, UserX, Search, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface QueuePatient {
  id: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  patientType: string;
  appointment: {
    id: number;
    startTime: string;
    status: string;
    appointmentType: string;
    doctor: {
      id: number;
      name: string;
    };
  };
  checkedInAt?: string;
  checkedOutAt?: string;
}

interface QueueResponse {
  queue: QueuePatient[];
  stats: {
    waiting: number;
    inProgress: number;
    completed: number;
  };
}

export default function PatientQueuePage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'waiting' | 'in-progress' | 'completed'>('all');

  const { data: queueData, isLoading, refetch } = useQuery<QueueResponse>({
    queryKey: ['patient-queue', filterStatus],
    queryFn: async () => {
      const response = await axios.get('/api/patient-queue', {
        params: { status: filterStatus !== 'all' ? filterStatus : undefined },
      });
      return response.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const response = await axios.patch(`/api/appointments/${appointmentId}`, {
        status: 'checked_in',
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Patient checked in successfully');
      refetch();
    },
    onError: () => {
      toast.error('Failed to check in patient');
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const response = await axios.patch(`/api/appointments/${appointmentId}`, {
        status: 'completed',
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Patient checked out successfully');
      refetch();
    },
    onError: () => {
      toast.error('Failed to check out patient');
    },
  });

  const handleCheckIn = (appointmentId: number) => {
    checkInMutation.mutate(appointmentId);
  };

  const handleCheckOut = (appointmentId: number) => {
    checkOutMutation.mutate(appointmentId);
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

  const getStatusBadge = (appointment: QueuePatient['appointment'], checkedInAt?: string, checkedOutAt?: string) => {
    if (checkedOutAt || appointment.status === 'completed') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>;
    }
    if (appointment.status === 'checked_in') {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Checked In</span>;
    }
    if (appointment.status === 'scheduled') {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Scheduled</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{appointment.status}</span>;
  };

  const filteredQueue = queueData?.queue.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tory-blue mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading patient queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Patient Queue</h1>
          <p className="text-muted-foreground mt-1">Outpatient check-in and waiting room management</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Last updated: {format(new Date(), 'HH:mm:ss')}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Waiting</p>
              <p className="text-3xl font-bold text-yellow-900">{queueData?.stats.waiting || 0}</p>
            </div>
            <Users className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">In Progress</p>
              <p className="text-3xl font-bold text-blue-900">{queueData?.stats.inProgress || 0}</p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Completed</p>
              <p className="text-3xl font-bold text-green-900">{queueData?.stats.completed || 0}</p>
            </div>
            <UserX className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tory-blue"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'waiting' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setFilterStatus('waiting')}
          >
            Waiting
          </Button>
          <Button
            variant={filterStatus === 'in-progress' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setFilterStatus('in-progress')}
          >
            In Progress
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Patient Queue Table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-spindle border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Appointment Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {filteredQueue && filteredQueue.length > 0 ? (
                filteredQueue.map((patient) => (
                  <tr key={patient.id} className="hover:bg-spindle transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-tory-blue rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {patient.firstName[0]}{patient.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {calculateAge(patient.dob)} yrs • {patient.gender}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        {format(new Date(patient.appointment.startTime), 'HH:mm')}
                      </div>
                      {patient.checkedInAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Checked in: {format(new Date(patient.checkedInAt), 'HH:mm')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{patient.appointment.doctor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {patient.appointment.appointmentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(patient.appointment, patient.checkedInAt, patient.checkedOutAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {patient.appointment.status === 'scheduled' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCheckIn(patient.appointment.id)}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Check In
                          </Button>
                        )}
                        {patient.appointment.status === 'checked_in' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckOut(patient.appointment.id)}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Check Out
                          </Button>
                        )}
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No patients in queue</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
