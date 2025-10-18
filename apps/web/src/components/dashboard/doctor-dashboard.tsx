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
  // Fetch appointments data
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments-dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/appointments?limit=100');
      return response.data;
    },
  });

  // Fetch lab orders/results data
  const { data: labOrdersData, isLoading: labOrdersLoading } = useQuery({
    queryKey: ['lab-orders-dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/lab-orders?limit=100');
      return response.data;
    },
  });

  // Fetch inventory data
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/inventory?limit=100');
      return response.data;
    },
  });

  // Calculate today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = appointmentsData?.appointments?.filter((apt: any) => {
    const aptDate = new Date(apt.startTime);
    return aptDate >= today && aptDate < tomorrow;
  }) || [];

  // Get pending lab results (completed orders with results that aren't finalized)
  const pendingLabResults = labOrdersData?.orders?.filter((order: any) => 
    order.labResults?.some((result: any) => !result.finalized)
  ).length || 0;

  // Get follow-ups due (appointments marked as follow-up in next 7 days)
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const followUpsDue = appointmentsData?.appointments?.filter((apt: any) => {
    const aptDate = new Date(apt.startTime);
    return aptDate >= today && aptDate <= nextWeek && 
           (apt.appointmentType?.toLowerCase().includes('follow') || 
            apt.department?.toLowerCase().includes('follow'));
  }).length || 0;

  // Get critical/low stock inventory items
  const lowStockItems = inventoryData?.items?.filter((item: any) => 
    item.quantity <= item.reorderLevel
  ) || [];

  const isLoading = appointmentsLoading || labOrdersLoading || inventoryLoading;

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
            value={isLoading ? '...' : todayAppointments.length}
            icon={Calendar}
            color="blue"
          />
        </Link>
        <Link href="/lab-orders">
          <StatCard
            title="Pending Lab Results"
            value={isLoading ? '...' : pendingLabResults}
            icon={TestTube}
            color="yellow"
          />
        </Link>
        <Link href="/appointments">
          <StatCard
            title="Follow-ups Due"
            value={isLoading ? '...' : followUpsDue}
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

        {/* Lab Result Notifications */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Lab Results Ready</h2>
            <Link href="/lab-orders" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {labOrdersLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading lab results...</p>
              </div>
            ) : labOrdersData?.orders?.filter((order: any) => 
                order.labResults?.length > 0
              ).length === 0 ? (
              <div className="p-8 text-center">
                <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No lab results available</p>
              </div>
            ) : (
              labOrdersData.orders
                .filter((order: any) => order.labResults?.length > 0)
                .slice(0, 3)
                .map((order: any) => {
                  const hasUnfinalized = order.labResults.some((r: any) => !r.finalized);
                  return (
                    <Link key={order.id} href={`/lab-orders/${order.id}`}>
                      <div className={`p-3 border rounded-lg ${
                        hasUnfinalized ? 'bg-green-haze/5 border-green-haze/20' : ''
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            {order.patient?.firstName} {order.patient?.lastName} - {order.orderType.replace('_', ' ')}
                          </p>
                          {hasUnfinalized && (
                            <span className="text-xs text-green-haze font-semibold">NEEDS REVIEW</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.description?.substring(0, 50) || 'Lab test results'} • {order.labResults.length} result(s)
                        </p>
                        <p className="text-xs text-primary hover:underline mt-2">
                          {hasUnfinalized ? 'Review & Approve →' : 'View Results →'}
                        </p>
                      </div>
                    </Link>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Pharmacy Inventory Widget */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pharmacy Inventory Status</h2>
          <Link href="/inventory" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {inventoryLoading ? (
            <div className="col-span-3 p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading inventory...</p>
            </div>
          ) : !inventoryData?.items || inventoryData.items.length === 0 ? (
            <div className="col-span-3 p-8 text-center">
              <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">No inventory items found</p>
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="col-span-3 p-8 text-center">
              <div className="w-12 h-12 bg-green-haze/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Pill className="w-6 h-6 text-green-haze" />
              </div>
              <p className="text-sm text-green-haze font-medium">All medications well stocked</p>
              <p className="text-xs text-muted-foreground mt-1">No items below reorder level</p>
            </div>
          ) : (
            lowStockItems.slice(0, 3).map((item: any) => {
              const percentage = (item.quantity / (item.reorderLevel * 2)) * 100;
              const isCritical = item.quantity <= item.reorderLevel / 2;
              const isLow = !isCritical && item.quantity <= item.reorderLevel;
              
              return (
                <Link key={item.id} href={`/inventory/${item.id}`}>
                  <div className={`p-4 border rounded-lg ${
                    isCritical 
                      ? 'bg-red-ribbon/5 border-red-ribbon/20' 
                      : 'bg-saffron/5 border-saffron/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{item.name}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        isCritical 
                          ? 'bg-red-ribbon text-white' 
                          : 'bg-saffron text-black'
                      }`}>
                        {isCritical ? 'Critical' : 'Low Stock'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit || 'units'} remaining
                    </p>
                    <div className="mt-2 w-full bg-muted h-1.5 rounded-full">
                      <div 
                        className={`h-1.5 rounded-full ${isCritical ? 'bg-red-ribbon' : 'bg-saffron'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/patients" className="p-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-center cursor-pointer">
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Open Patient File</p>
          </Link>
          <Link href="/prescriptions" className="p-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-center cursor-pointer">
            <Pill className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Create Prescription</p>
          </Link>
          <Link href="/lab-orders" className="p-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-center cursor-pointer">
            <TestTube className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Request Lab Order</p>
          </Link>
          <Link href="/appointments" className="p-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-center cursor-pointer">
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">View Full Schedule</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

