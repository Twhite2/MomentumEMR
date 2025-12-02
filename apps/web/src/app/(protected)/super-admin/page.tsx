'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  Building2, CreditCard, AlertCircle, TrendingUp, Users, Activity,
  PieChart, BarChart3, Bell, CheckCircle, Clock, Pill, TestTube,
  FileText, Percent, AlertTriangle, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@momentum/ui';

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Momentum Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform-wide overview and hospital management</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Momentum Super Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Platform-wide overview and hospital management
        </p>
      </div>

      {/* Top Metrics Row - Enhanced KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hospitals</p>
              <p className="text-3xl font-bold text-primary mt-1">{stats?.totalHospitals || 0}</p>
              <p className="text-xs text-green-600 mt-1">+{stats?.hospitalsThisMonth || 0} this month</p>
            </div>
            <Building2 className="w-12 h-12 text-primary/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats?.totalPatients?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all hospitals</p>
            </div>
            <Users className="w-12 h-12 text-orange-600/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats?.activeSubscriptions || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats?.pendingSubscriptions || 0} pending</p>
            </div>
            <CreditCard className="w-12 h-12 text-green-600/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New Patients This Week</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats?.newPatientsThisWeek || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Weekly registrations</p>
            </div>
            <UserPlus className="w-12 h-12 text-blue-600/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Subscription Revenue</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">₦{((stats?.totalSubscriptionRevenue || 0) / 1000).toFixed(0)}K</p>
              <p className="text-xs text-muted-foreground mt-1">Monthly recurring</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-600/20" />
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Type Breakdown */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            Patient Type Breakdown
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>HMO Patients</span>
                <span className="font-semibold">{stats?.patientTypeBreakdown?.hmo?.percentage || 0}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${stats?.patientTypeBreakdown?.hmo?.percentage || 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Corporate Clients</span>
                <span className="font-semibold">{stats?.patientTypeBreakdown?.corporate?.percentage || 0}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats?.patientTypeBreakdown?.corporate?.percentage || 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Self-Pay</span>
                <span className="font-semibold">{stats?.patientTypeBreakdown?.self_pay?.percentage || 0}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${stats?.patientTypeBreakdown?.self_pay?.percentage || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Monitoring */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            System Monitoring
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm">Active Users Now</span>
              </div>
              <span className="font-bold text-primary">{stats?.activeUsersNow || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm">Error Logs</span>
              </div>
              <span className="font-bold text-red-600">{stats?.systemMonitoring?.errorLogs || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="text-sm">Failed Processes</span>
              </div>
              <span className="font-bold text-orange-600">{stats?.systemMonitoring?.failedProcesses || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Avg Time Per User</span>
              </div>
              <span className="font-bold text-blue-600">{stats?.systemMonitoring?.avgTimePerUser || 0} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Invoices</p>
              <p className="text-lg font-bold text-primary">
                {(stats?.platformStatistics?.totalInvoices || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Claims</p>
              <p className="text-lg font-bold text-green-600">
                {(stats?.platformStatistics?.totalClaims || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600/10 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Notifications</p>
              <p className="text-lg font-bold text-orange-600">
                {(stats?.platformStatistics?.totalNotifications || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Read Rate</p>
              <p className="text-lg font-bold text-blue-600">
                {stats?.platformStatistics?.notificationReadRate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Pill className="w-5 h-5 text-amaranth" />
            Weekly Medication Activity
          </h2>
          <div className="p-4 bg-amaranth/10 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Medications Dispensed This Week</p>
            <p className="text-4xl font-bold text-amaranth">
              {(stats?.weeklyActivity?.medicationsDispensed || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5 text-danube" />
            Weekly Lab Activity
          </h2>
          <div className="p-4 bg-danube/10 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Lab Tests Ordered This Week</p>
            <p className="text-4xl font-bold text-danube">
              {(stats?.weeklyActivity?.labTestsOrdered || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Adoption Metrics */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Adoption Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 border border-border rounded-lg text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Percent className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">User Activity Levels</p>
            <p className="text-3xl font-bold text-primary">{stats?.adoptionMetrics?.userActivityLevel || 0}%</p>
          </div>
          
          <div className="p-4 border border-border rounded-lg text-center">
            <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">Hospital Usage Score</p>
            <p className="text-3xl font-bold text-green-600">{stats?.adoptionMetrics?.hospitalUsageScore || 0}%</p>
          </div>
          
          <div className="p-4 border border-border rounded-lg text-center">
            <div className="w-12 h-12 bg-orange-600/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">Avg Consult Time</p>
            <p className="text-3xl font-bold text-orange-600">{stats?.adoptionMetrics?.avgConsultTimePerHospital || 0} min</p>
          </div>
          
          <div className="p-4 border border-border rounded-lg text-center">
            <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">Complete Records</p>
            <p className="text-3xl font-bold text-blue-600">{Math.round(stats?.adoptionMetrics?.completeRecordsPercentage || 0)}%</p>
          </div>
          
          <div className="p-4 border border-border rounded-lg text-center">
            <div className="w-12 h-12 bg-purple-600/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">HMO Usage</p>
            <p className="text-3xl font-bold text-purple-600">{Math.round(stats?.adoptionMetrics?.hmoUsagePercentage || 0)}%</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/hospitals">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Manage Hospitals</h3>
                <p className="text-sm text-muted-foreground">View, suspend, or activate</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/subscriptions">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-green-600 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Subscription Plans</h3>
                <p className="text-sm text-muted-foreground">Manage pricing & features</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/analytics">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-orange-600 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-600/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Aggregated Reports</h3>
                <p className="text-sm text-muted-foreground">View detailed analytics</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Hospitals */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">Recent Hospital Registrations</h2>
          <Link href="/hospitals">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {stats?.recentHospitals && stats.recentHospitals.length > 0 ? (
            stats.recentHospitals.map((hospital: any) => (
              <div key={hospital.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{hospital.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {hospital.plan} • {new Date(hospital.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      hospital.status === 'Active'
                        ? 'bg-green-600/10 text-green-600'
                        : 'bg-orange-600/10 text-orange-600'
                    }`}
                  >
                    {hospital.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No recent hospital registrations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
