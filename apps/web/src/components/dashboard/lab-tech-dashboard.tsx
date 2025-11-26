'use client';

import { StatCard } from './stat-card';
import { TestTube, CheckCircle, Upload, FileCheck, Clock } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface LabTechDashboardProps {
  session: Session;
}

export default function LabTechDashboard({ session }: LabTechDashboardProps) {
  // Fetch investigations data
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['lab-orders-dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/lab-orders?limit=100');
      return response.data;
    },
  });

  // Fetch lab results data
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['lab-results-dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/lab-results?limit=100');
      return response.data;
    },
  });

  // Calculate stats from real data
  const pendingOrders = ordersData?.orders?.filter((order: any) => 
    order.status === 'pending'
  ).length || 0;

  const inProgressOrders = ordersData?.orders?.filter((order: any) => 
    order.status === 'in_progress'
  ).length || 0;

  const completedToday = ordersData?.orders?.filter((order: any) => {
    if (order.status !== 'completed') return false;
    const today = new Date();
    const orderDate = new Date(order.updatedAt);
    return orderDate.toDateString() === today.toDateString();
  }).length || 0;

  const pendingResults = resultsData?.results?.filter((result: any) => 
    !result.finalized
  ).length || 0;

  const releasedResults = resultsData?.results?.filter((result: any) => 
    result.releasedToPatient
  ).length || 0;

  // Get recent orders (all statuses, sorted by created date, limit to 5)
  const recentOrders = ordersData?.orders
    ?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    ?.slice(0, 5) || [];

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const isLoading = ordersLoading || resultsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground mt-1">Lab Scientist Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/lab-orders?status=pending">
          <StatCard 
            title="Pending Orders" 
            value={isLoading ? '...' : pendingOrders} 
            icon={TestTube} 
            color="yellow" 
          />
        </Link>
        <Link href="/lab-orders?status=in_progress">
          <StatCard 
            title="In Progress" 
            value={isLoading ? '...' : inProgressOrders} 
            icon={Clock} 
            color="blue" 
          />
        </Link>
        <Link href="/lab-orders?status=completed">
          <StatCard 
            title="Completed Today" 
            value={isLoading ? '...' : completedToday} 
            icon={CheckCircle} 
            color="green" 
          />
        </Link>
        <Link href="/lab-results?status=pending">
          <StatCard 
            title="Results to Finalize" 
            value={isLoading ? '...' : pendingResults} 
            icon={FileCheck} 
            color="red" 
          />
        </Link>
      </div>

      {/* Investigations Queue */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Investigations</h2>
          <Link href="/lab-orders" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading orders...</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">No recent investigations</p>
            </div>
          ) : (
            recentOrders.map((order: any) => (
              <Link key={order.id} href={`/lab-orders/${order.id}`}>
                <div className={`p-3 border rounded-lg hover:bg-muted/30 transition-colors ${
                  order.status === 'in_progress' ? 'bg-saffron/5 border-saffron/20' : ''
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {order.orderType.replace('_', ' ')} - {order.patient.firstName} {order.patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Order #LAB-{order.id.toString().padStart(6, '0')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ordered: {formatTimeAgo(order.createdAt)} • Dr. {order.doctor.name}
                      </p>
                      {order.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {order.description}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 ${
                      order.status === 'pending' 
                        ? 'bg-spindle text-primary' 
                        : order.status === 'in_progress'
                        ? 'bg-saffron text-black'
                        : 'bg-green-haze text-white'
                    }`}>
                      {order.status === 'pending' ? 'Pending' : 
                       order.status === 'in_progress' ? 'In Progress' : 'Completed'}
                    </span>
                  </div>
                  {order.labResults?.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      {order.labResults.length} result(s) uploaded
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

