'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Users, Clock, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { subscribeToQueue, updateQueue } from '@/lib/socket-client';

interface QueueItem {
  id: number;
  appointmentId: number;
  patientName: string;
  appointmentType: string;
  doctorName: string;
  checkInTime: string;
  status: 'waiting' | 'in_progress' | 'completed';
  position: number;
}

export default function QueuePage() {
  const { data: session } = useSession();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const queryClient = useQueryClient();

  // Fetch initial queue
  const { data: appointmentsData } = useQuery({
    queryKey: ['queue-appointments'],
    queryFn: async () => {
      const response = await axios.get('/api/appointments?status=checked_in');
      return response.data;
    },
  });

  useEffect(() => {
    if (appointmentsData?.appointments) {
      const queueItems = appointmentsData.appointments.map((apt: any, index: number) => ({
        id: apt.id,
        appointmentId: apt.id,
        patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
        appointmentType: apt.appointmentType,
        doctorName: apt.doctor.name,
        checkInTime: apt.updatedAt,
        status: 'waiting',
        position: index + 1,
      }));
      setQueue(queueItems);
    }
  }, [appointmentsData]);

  // Subscribe to real-time queue updates
  useEffect(() => {
    const unsubscribe = subscribeToQueue((data) => {
      console.log('Queue updated:', data);
      queryClient.invalidateQueries({ queryKey: ['queue-appointments'] });
      toast.info('Queue updated');
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const moveToInProgress = (appointmentId: number) => {
    const updatedQueue = queue.map((item) =>
      item.appointmentId === appointmentId ? { ...item, status: 'in_progress' as const } : item
    );
    setQueue(updatedQueue);
    updateQueue({ appointmentId, status: 'in_progress' });
    toast.success('Patient called');
  };

  const moveToCompleted = (appointmentId: number) => {
    const updatedQueue = queue.filter((item) => item.appointmentId !== appointmentId);
    setQueue(updatedQueue);
    updateQueue({ appointmentId, status: 'completed' });
    toast.success('Consultation completed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-saffron/10 text-saffron';
      case 'in_progress':
        return 'bg-primary/10 text-primary';
      case 'completed':
        return 'bg-green-haze/10 text-green-haze';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const waitingCount = queue.filter((item) => item.status === 'waiting').length;
  const inProgressCount = queue.filter((item) => item.status === 'in_progress').length;
  const completedToday = 0; // You could track this separately

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Queue</h1>
          <p className="text-muted-foreground mt-1">Real-time queue management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-haze rounded-full animate-pulse"></div>
            <span className="text-muted-foreground">Live Updates</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Waiting</p>
            <Clock className="w-5 h-5 text-saffron" />
          </div>
          <p className="text-3xl font-bold">{waitingCount}</p>
          <p className="text-sm text-saffron mt-1">Patients in queue</p>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{inProgressCount}</p>
          <p className="text-sm text-primary mt-1">Being attended</p>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Completed Today</p>
            <CheckCircle className="w-5 h-5 text-green-haze" />
          </div>
          <p className="text-3xl font-bold">{completedToday}</p>
          <p className="text-sm text-green-haze mt-1">Consultations</p>
        </div>
      </div>

      {/* Queue List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting */}
        <div className="bg-white rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-saffron" />
              Waiting ({waitingCount})
            </h2>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {queue
              .filter((item) => item.status === 'waiting')
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-primary">
                          #{item.position}
                        </span>
                        <h3 className="font-semibold">{item.patientName}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.appointmentType}
                      </p>
                      <p className="text-sm text-muted-foreground">Dr. {item.doctorName}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Checked in {formatTime(item.checkInTime)}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => moveToInProgress(item.appointmentId)}
                    >
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Call Patient
                    </Button>
                  </div>
                </div>
              ))}
            {waitingCount === 0 && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No patients waiting</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              In Progress ({inProgressCount})
            </h2>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {queue
              .filter((item) => item.status === 'in_progress')
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-primary/50 bg-primary/5 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.patientName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.appointmentType}
                      </p>
                      <p className="text-sm text-muted-foreground">Dr. {item.doctorName}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Started {formatTime(item.checkInTime)}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => moveToCompleted(item.appointmentId)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            {inProgressCount === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No consultations in progress</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

