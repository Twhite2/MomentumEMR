'use client';

import { StatCard } from './stat-card';
import { Users, Calendar, DollarSign, UserPlus, Package, TrendingUp } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface AdminDashboardProps {
  session: Session;
}

export default function AdminDashboard({ session }: AdminDashboardProps) {
  // Fetch real dashboard statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/stats');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {session.user.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Hospital Admin Dashboard - {session.user.hospitalName}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {session.user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Hospital Admin Dashboard - {session.user.hospitalName}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/patients">
          <StatCard
            title="Total Patients"
            value={stats?.totalPatients?.toLocaleString() || '0'}
            icon={Users}
            color="blue"
          />
        </Link>
        <Link href="/users">
          <StatCard
            title="Total Staff"
            value={stats?.totalStaff || 0}
            icon={UserPlus}
            color="purple"
          />
        </Link>
        <Link href="/appointments">
          <StatCard
            title="Today's Appointments"
            value={stats?.todayAppointments || 0}
            icon={Calendar}
            color="green"
          />
        </Link>
        <Link href="/billing">
          <StatCard
            title="Revenue This Month"
            value={`₦${((stats?.revenueThisMonth || 0) / 1000).toFixed(0)}K`}
            icon={DollarSign}
            color="yellow"
          />
        </Link>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Type Breakdown */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Patient Type Breakdown</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">HMO Patients</span>
              <span className="font-semibold">
                {stats?.patientTypeBreakdown?.hmo?.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Corporate Patients</span>
              <span className="font-semibold">
                {stats?.patientTypeBreakdown?.corporate?.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Self Pay</span>
              <span className="font-semibold">
                {stats?.patientTypeBreakdown?.self_pay?.percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full">
              <div className="bg-green-haze h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
            <Package className="w-5 h-5 text-red-ribbon" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-ribbon/5 rounded-lg">
              <div>
                <p className="text-sm font-medium">Insulin Syringes</p>
                <p className="text-xs text-muted-foreground">8 units remaining</p>
              </div>
              <span className="text-xs font-semibold text-red-ribbon">Critical</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-saffron/5 rounded-lg">
              <div>
                <p className="text-sm font-medium">Surgical Gloves</p>
                <p className="text-xs text-muted-foreground">50 boxes remaining</p>
              </div>
              <span className="text-xs font-semibold text-saffron">Low</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-saffron/5 rounded-lg">
              <div>
                <p className="text-sm font-medium">Amoxicillin 250mg</p>
                <p className="text-xs text-muted-foreground">300 units remaining</p>
              </div>
              <span className="text-xs font-semibold text-saffron">Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Patient Inflow Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Revenue Trend</h2>
            <TrendingUp className="w-5 h-5 text-green-haze" />
          </div>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Chart placeholder - Revenue trend over time</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Patient Inflow</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Chart placeholder - Patient visits by day</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/users" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center cursor-pointer">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Manage Users</p>
          </Link>
          <Link href="/appointments" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center cursor-pointer">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">View Schedule</p>
          </Link>
          <Link href="/inventory" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center cursor-pointer">
            <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Check Inventory</p>
          </Link>
          <Link href="/analytics" className="p-4 border border-border rounded-lg hover:bg-spindle transition-colors text-center cursor-pointer">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">View Reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

