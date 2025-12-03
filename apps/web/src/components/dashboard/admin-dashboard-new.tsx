'use client';

import { StatCard } from './stat-card';
import { 
  Users, Calendar, DollarSign, UserPlus, Package, 
  TrendingUp, AlertTriangle, BedDouble, LogOut,
  TestTube, FileText, UserCog, Receipt, Clock
} from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface AdminDashboardProps {
  session: Session;
}

export default function AdminDashboard({ session }: AdminDashboardProps) {
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
            Good morning, {session.user.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Hospital Admin Dashboard - {session.user.hospitalName}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate pie chart percentages
  const hmoPercentage = stats?.patientTypeBreakdown?.hmo?.percentage || 0;
  const corporatePercentage = stats?.patientTypeBreakdown?.corporate?.percentage || 0;
  const selfPayPercentage = stats?.patientTypeBreakdown?.self_pay?.percentage || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Good morning, {session.user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Hospital Admin Dashboard - {session.user.hospitalName}
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
            title="Appointments Today"
            value={stats?.todayAppointments || 0}
            icon={Calendar}
            color="green"
          />
        </Link>
        <Link href="/invoices">
          <div className="cursor-pointer">
            <div className="bg-white rounded-lg border border-border p-6 hover:border-primary transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Revenue Today</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₦{((stats?.revenueTodayTotal || 0) / 1000).toFixed(1)}K
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-green-600">Paid: ₦{((stats?.revenueTodayPaid || 0) / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-orange-600">Pending: ₦{((stats?.revenueTodayPending || 0) / 1000).toFixed(1)}K</p>
                  </div>
                </div>
                <DollarSign className="w-10 h-10 text-yellow-500/20" />
              </div>
            </div>
          </div>
        </Link>
        <Link href="/inventory">
          <div className="cursor-pointer">
            <div className="bg-white rounded-lg border border-border p-6 hover:border-primary transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Inventory Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₦{((stats?.inventoryTotalValue || 0) / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats?.inventoryTotalItems || 0} items
                  </p>
                </div>
                <Package className="w-10 h-10 text-orange-500/20" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Middle Section: Patient Breakdown & Low Stock & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Type Breakdown */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Patient Type Breakdown</h2>
          <div className="space-y-4">
            {/* Simple Pie Chart */}
            <div className="w-40 h-40 mx-auto rounded-full" style={{
              background: `conic-gradient(
                #00C853 0deg ${selfPayPercentage * 3.6}deg,
                #FFD700 ${selfPayPercentage * 3.6}deg ${(selfPayPercentage + corporatePercentage) * 3.6}deg,
                #FF69B4 ${(selfPayPercentage + corporatePercentage) * 3.6}deg 360deg
              )`
            }}></div>
            
            {/* Legend */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF69B4]"></div>
                  <span className="text-sm text-muted-foreground">HMO</span>
                </div>
                <span className="text-sm font-semibold">{hmoPercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FFD700]"></div>
                  <span className="text-sm text-muted-foreground">Corporate</span>
                </div>
                <span className="text-sm font-semibold">{corporatePercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00C853]"></div>
                  <span className="text-sm text-muted-foreground">Self Pay</span>
                </div>
                <span className="text-sm font-semibold">{selfPayPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
            <AlertTriangle className="w-5 h-5 text-red-ribbon" />
          </div>
          <div className="space-y-4">
            {/* Pharmacy */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Pharmacy (Top 3)</p>
              <div className="space-y-2">
                {stats?.pharmacyLowStock?.length > 0 ? (
                  stats.pharmacyLowStock.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <p className="text-xs truncate flex-1">{item.item_name}</p>
                      <span className="text-xs font-semibold text-red-600 ml-2">{item.stock_quantity}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">All stocked</p>
                )}
              </div>
            </div>

            {/* Lab */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Lab (Top 3)</p>
              <div className="space-y-2">
                {stats?.labLowStock?.length > 0 ? (
                  stats.labLowStock.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <p className="text-xs truncate flex-1">{item.item_name}</p>
                      <span className="text-xs font-semibold text-orange-600 ml-2">{item.stock_quantity}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">All stocked</p>
                )}
              </div>
            </div>

            {/* Nursing */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Nursing (Top 3)</p>
              <div className="space-y-2">
                {stats?.nurseLowStock?.length > 0 ? (
                  stats.nurseLowStock.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <p className="text-xs truncate flex-1">{item.item_name}</p>
                      <span className="text-xs font-semibold text-yellow-600 ml-2">{item.stock_quantity}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">All stocked</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/users">
              <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer text-center">
                <UserCog className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium">Manage Users</p>
              </div>
            </Link>
            <Link href="/inventory">
              <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer text-center">
                <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium">Check Inventory</p>
              </div>
            </Link>
            <Link href="/invoices">
              <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer text-center">
                <Receipt className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium">Billing</p>
              </div>
            </Link>
            <Link href="/patient-queue">
              <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium">Patient Queue</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Revenue Trend by Category</h2>
            <TrendingUp className="w-5 h-5 text-green-haze" />
          </div>
          <div className="flex justify-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <span>Corporate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>HMO</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Self-pay</span>
            </div>
          </div>
          <div className="h-64 border border-border rounded flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Revenue trend chart (Jan-June)</p>
          </div>
        </div>

        {/* Patient Inflow Chart */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Patient Inflow (New & Revisits)</h2>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex justify-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <span>OPD New</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>OPD New</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Revisit</span>
            </div>
          </div>
          <div className="h-64 border border-border rounded flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Patient inflow stacked bar chart (Mon-Thu)</p>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <BedDouble className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Admissions Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.admissionsToday || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <LogOut className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Discharges Today</p>
                <p className="text-2xl font-bold text-green-600">{stats?.dischargesToday || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₦{((stats?.revenueThisMonth || 0) / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
