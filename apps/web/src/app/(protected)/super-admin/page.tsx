'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, CreditCard, AlertCircle, TrendingUp, Users, Activity, PieChart, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@momentum/ui';

export default function SuperAdminDashboard() {
  // Fetch super admin statistics
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
          {[1, 2, 3].map((i) => (
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats?.totalPatients?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all hospitals</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-600/20" />
          </div>
        </div>
      </div>

      {/* Business Analytics Section */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Business Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Type Breakdown */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Patient Type Breakdown
            </h3>
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

          {/* Patient Age Distribution */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Patient Age Distribution
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>0-18 years</span>
                  <span className="font-semibold">{stats?.ageDistribution?.['0-18']?.percentage || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${stats?.ageDistribution?.['0-18']?.percentage || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>19-35 years</span>
                  <span className="font-semibold">{stats?.ageDistribution?.['19-35']?.percentage || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats?.ageDistribution?.['19-35']?.percentage || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>36-60 years</span>
                  <span className="font-semibold">{stats?.ageDistribution?.['36-60']?.percentage || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${stats?.ageDistribution?.['36-60']?.percentage || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>60+ years</span>
                  <span className="font-semibold">{stats?.ageDistribution?.['60+']?.percentage || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: `${stats?.ageDistribution?.['60+']?.percentage || 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Cost/Patient</p>
              <p className="text-lg font-bold text-primary">
                ₦{(stats?.analytics?.avgCostPerPatient || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Appointments</p>
              <p className="text-lg font-bold text-green-600">
                {(stats?.analytics?.totalAppointments || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Investigations</p>
              <p className="text-lg font-bold text-orange-600">
                {(stats?.analytics?.totalInvestigations || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Invoices</p>
              <p className="text-lg font-bold text-red-600">
                {(stats?.analytics?.totalInvoices || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Hospital Signups Chart */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Monthly Hospital Signups</h2>
        <div className="h-64 flex items-end justify-between gap-2">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => {
            const height = Math.random() * 80 + 20;
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary rounded-t-lg hover:bg-primary/80 transition-colors cursor-pointer"
                  style={{ height: `${height}%` }}
                  title={`${month}: ${Math.floor(height / 10)} hospitals`}
                ></div>
                <span className="text-xs text-muted-foreground">{month}</span>
              </div>
            );
          })}
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

