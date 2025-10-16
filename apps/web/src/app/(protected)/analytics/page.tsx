'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input } from '@momentum/ui';
import {
  TrendingUp,
  Users,
  Calendar,
  Package,
  DollarSign,
  Activity,
  AlertTriangle,
  Building2,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === 'super_admin';
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // Fetch platform analytics for super admin
  const { data: platformData } = useQuery({
    queryKey: ['analytics-platform', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const response = await axios.get(`/api/analytics/platform?${params}`);
      return response.data;
    },
    enabled: isSuperAdmin,
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['analytics-subscriptions'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/subscriptions');
      return response.data;
    },
    enabled: isSuperAdmin,
  });

  const { data: systemData } = useQuery({
    queryKey: ['analytics-system'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/system');
      return response.data;
    },
    enabled: isSuperAdmin,
  });

  const { data: diseaseData } = useQuery({
    queryKey: ['analytics-diseases', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const response = await axios.get(`/api/analytics/diseases?${params}`);
      return response.data;
    },
    enabled: isSuperAdmin,
  });

  const { data: privacySettings } = useQuery({
    queryKey: ['analytics-privacy'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/privacy');
      return response.data;
    },
    enabled: isSuperAdmin,
  });

  // Fetch hospital analytics data for hospital staff
  const { data: revenueData } = useQuery({
    queryKey: ['analytics-revenue', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const response = await axios.get(`/api/analytics/revenue?${params}`);
      return response.data;
    },
    enabled: !isSuperAdmin,
  });

  const { data: patientData } = useQuery({
    queryKey: ['analytics-patients', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const response = await axios.get(`/api/analytics/patients?${params}`);
      return response.data;
    },
    enabled: !isSuperAdmin,
  });

  const { data: appointmentData } = useQuery({
    queryKey: ['analytics-appointments', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const response = await axios.get(`/api/analytics/appointments?${params}`);
      return response.data;
    },
    enabled: !isSuperAdmin,
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['analytics-inventory'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/inventory');
      return response.data;
    },
    enabled: !isSuperAdmin,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isSuperAdmin ? 'Platform Analytics' : 'Analytics & Reports'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isSuperAdmin
              ? 'System-wide insights and platform performance metrics'
              : 'Comprehensive insights and performance metrics'}
          </p>
        </div>
      </div>

      {/* Date Range Filter - Only for Hospital Staff */}
      {!isSuperAdmin && (
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <Input
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
            />
            <Input
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
            <Button
              variant="outline"
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {isSuperAdmin ? (
        // Super Admin - Platform-wide metrics
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Hospitals */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Hospitals</p>
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">
              {platformData ? platformData.summary.totalHospitals.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-green-haze mt-1">
              {platformData ? `${platformData.summary.activeHospitals} active` : ''}
            </p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <DollarSign className="w-5 h-5 text-green-haze" />
            </div>
            <p className="text-2xl font-bold">
              {subscriptionData ? formatCurrency(subscriptionData.summary.totalMonthlyRevenue) : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {subscriptionData ? `${subscriptionData.summary.activeSubscriptions} subscriptions` : ''}
            </p>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">
              {platformData ? platformData.summary.totalUsers.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-primary mt-1">
              {systemData ? `${systemData.summary.activeUsers} active` : ''}
            </p>
          </div>

          {/* System Activity */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Today's Activity</p>
              <Activity className="w-5 h-5 text-amaranth" />
            </div>
            <p className="text-2xl font-bold">
              {systemData ? systemData.summary.todayAppointments.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-amaranth mt-1">
              {systemData ? 'appointments' : ''}
            </p>
          </div>
        </div>
      ) : (
        // Hospital Staff - Hospital-specific metrics
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <DollarSign className="w-5 h-5 text-green-haze" />
            </div>
            <p className="text-2xl font-bold">
              {revenueData ? formatCurrency(revenueData.summary.totalRevenue) : '...'}
            </p>
            <p className="text-sm text-green-haze mt-1">
              {revenueData
                ? `${revenueData.summary.collectionRate.toFixed(1)}% collected`
                : ''}
            </p>
          </div>

          {/* Total Patients */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">
              {patientData ? patientData.summary.totalPatients.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-primary mt-1">
              {patientData ? `+${patientData.summary.newPatients} this period` : ''}
            </p>
          </div>

          {/* Appointments */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Appointments</p>
              <Calendar className="w-5 h-5 text-amaranth" />
            </div>
            <p className="text-2xl font-bold">
              {appointmentData
                ? appointmentData.summary.totalAppointments.toLocaleString()
                : '...'}
            </p>
            <p className="text-sm text-amaranth mt-1">
              {appointmentData
                ? `${appointmentData.summary.completionRate.toFixed(1)}% completion`
                : ''}
            </p>
          </div>

          {/* Inventory Value */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Inventory Value</p>
              <Package className="w-5 h-5 text-saffron" />
            </div>
            <p className="text-2xl font-bold">
              {inventoryData ? formatCurrency(inventoryData.summary.totalValue) : '...'}
            </p>
            <p className="text-sm text-saffron mt-1">
              {inventoryData ? `${inventoryData.summary.totalItems} items` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Super Admin Analytics Sections */}
      {isSuperAdmin && (platformData || subscriptionData || systemData) && (
        <>
          {/* Subscription Revenue Breakdown */}
          {subscriptionData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Plan */}
              <div className="bg-white rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-haze" />
                  Subscription Revenue by Plan
                </h2>
                <div className="space-y-3">
                  {Object.entries(subscriptionData.revenueByPlan).map(
                    ([plan, data]: [string, any]) => (
                      <div key={plan} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                        <div>
                          <p className="font-medium">{plan}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.activeCount} active / {data.count} total
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(data.monthlyRevenue)}</p>
                          <p className="text-xs text-muted-foreground">/month</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Monthly</span>
                    <span className="font-bold text-green-haze">
                      {formatCurrency(subscriptionData.summary.totalMonthlyRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Projected Yearly</span>
                    <span className="font-semibold">
                      {formatCurrency(subscriptionData.summary.totalYearlyRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Hospitals */}
              <div className="bg-white rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Top Hospitals by Activity
                </h2>
                <div className="space-y-3">
                  {systemData?.topHospitals?.map((hospital: any) => (
                    <div key={hospital.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{hospital.name}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>{hospital.userCount} users</span>
                          <span>{hospital.patientCount} patients</span>
                          <span>{hospital.appointmentCount} appointments</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-primary">
                          Score: {hospital.activityScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* System Health & Activity */}
          {systemData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* System Health */}
              <div className="bg-white rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-haze" />
                  System Health
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-haze/10 rounded">
                    <span className="text-sm">Status</span>
                    <span className="font-semibold text-green-haze capitalize">
                      {systemData.systemHealth.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="text-sm">Active Hospitals</span>
                    <span className="font-semibold">
                      {systemData.systemHealth.activeHospitals} / {systemData.systemHealth.totalHospitals}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="text-sm">Uptime</span>
                    <span className="font-semibold">{systemData.systemHealth.uptime}</span>
                  </div>
                </div>
              </div>

              {/* Appointment Activity */}
              <div className="bg-white rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amaranth" />
                  Appointment Activity
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Today</p>
                    <p className="text-2xl font-bold">{systemData.summary.todayAppointments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last 7 Days</p>
                    <p className="text-2xl font-bold">{systemData.summary.last7DaysAppointments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Growth Rate</p>
                    <p className="text-xl font-semibold text-green-haze">
                      {systemData.summary.appointmentGrowthRate}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Platform Stats */}
              <div className="bg-white rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Platform Statistics
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="text-sm">Total Patients</span>
                    <span className="font-semibold">
                      {platformData?.summary.totalPatients.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="text-sm">Total Invoices</span>
                    <span className="font-semibold">
                      {systemData.summary.totalInvoices.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="text-sm">Notifications</span>
                    <span className="font-semibold">
                      {systemData.summary.unreadNotifications} / {systemData.summary.totalNotifications}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded">
                    <span className="text-sm">Read Rate</span>
                    <span className="font-semibold text-primary">
                      {systemData.summary.notificationReadRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Disease Analytics & Privacy Controls */}
          {diseaseData && privacySettings?.diseaseAnalytics?.enabled && (
            <div className="bg-white rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amaranth" />
                  Disease Analytics
                </h2>
                <div className="text-xs text-muted-foreground">
                  {privacySettings.diseaseAnalytics.visibleToSuperAdmin && (
                    <span className="px-2 py-1 bg-green-haze/10 text-green-haze rounded">
                      Visible to Super Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-amaranth/10 rounded">
                  <p className="text-xs text-muted-foreground">Total Diseases</p>
                  <p className="text-xl font-bold text-amaranth">
                    {diseaseData.summary.totalDiseases}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded">
                  <p className="text-xs text-muted-foreground">Total Cases</p>
                  <p className="text-xl font-bold text-primary">
                    {diseaseData.summary.totalCases}
                  </p>
                </div>
                <div className="p-3 bg-green-haze/10 rounded">
                  <p className="text-xs text-muted-foreground">Unique Patients</p>
                  <p className="text-xl font-bold text-green-haze">
                    {diseaseData.summary.totalPatients}
                  </p>
                </div>
                <div className="p-3 bg-saffron/10 rounded">
                  <p className="text-xs text-muted-foreground">Avg Cases/Disease</p>
                  <p className="text-xl font-bold text-saffron">
                    {diseaseData.summary.avgCasesPerDisease}
                  </p>
                </div>
              </div>

              {/* Top Diseases */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                  Top Diseases
                </h3>
                {diseaseData.diseases.slice(0, 10).map((disease: any, index: number) => (
                  <div
                    key={disease.disease}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{disease.disease}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          {privacySettings.diseaseAnalytics.showPatientCount && (
                            <span>{disease.uniquePatients} patients</span>
                          )}
                          {privacySettings.diseaseAnalytics.showHospitalBreakdown && (
                            <span>• {disease.affectedHospitals} hospitals</span>
                          )}
                          <span>• {disease.trend === 'increasing' ? '📈' : disease.trend === 'decreasing' ? '📉' : '➡️'} {disease.trend}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amaranth">{disease.totalCases}</p>
                      <p className="text-xs text-muted-foreground">cases</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample Statistics */}
              {diseaseData.samples && privacySettings?.sampleAnalytics?.enabled && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-4">
                    Sample Collection Stats
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Total Samples</p>
                      <p className="text-lg font-bold">{diseaseData.samples.totalSamples}</p>
                    </div>
                    <div className="p-3 bg-orange-600/10 rounded">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-lg font-bold text-orange-600">
                        {diseaseData.samples.pendingSamples}
                      </p>
                    </div>
                    <div className="p-3 bg-green-haze/10 rounded">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-lg font-bold text-green-haze">
                        {diseaseData.samples.completedSamples}
                      </p>
                    </div>
                  </div>

                  {privacySettings.sampleAnalytics.showDetailedStats && diseaseData.samples.samplesByType?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        By Test Type
                      </p>
                      {diseaseData.samples.samplesByType.map((sample: any) => (
                        <div
                          key={sample.type}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                        >
                          <span>{sample.type}</span>
                          <span className="font-semibold">{sample.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Revenue Breakdown - Only for Hospital Staff */}
      {!isSuperAdmin && revenueData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Patient Type */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-haze" />
              Revenue by Patient Type
            </h2>
            <div className="space-y-3">
              {Object.entries(revenueData.revenueByPatientType).map(
                ([type, amount]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">
                      {type.replace('_', ' ')}
                    </span>
                    <span className="font-semibold">{formatCurrency(amount)}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Outstanding Balances */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-haze/10 rounded">
                <span className="text-sm">Paid Revenue</span>
                <span className="font-semibold text-green-haze">
                  {formatCurrency(revenueData.summary.paidRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-ribbon/10 rounded">
                <span className="text-sm">Outstanding Balance</span>
                <span className="font-semibold text-red-ribbon">
                  {formatCurrency(revenueData.summary.outstandingBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <span className="text-sm">Collection Rate</span>
                <span className="font-semibold">
                  {revenueData.summary.collectionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient & Appointment Stats - Only for Hospital Staff */}
      {!isSuperAdmin && (patientData || appointmentData) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Distribution */}
          {patientData && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Patient Distribution
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">By Type</p>
                  <div className="space-y-2">
                    {Object.entries(patientData.distribution.byType).map(
                      ([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm capitalize">
                            {type.replace('_', ' ')}
                          </span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">By Gender</p>
                  <div className="space-y-2">
                    {Object.entries(patientData.distribution.byGender).map(
                      ([gender, count]: [string, any]) => (
                        <div key={gender} className="flex items-center justify-between">
                          <span className="text-sm">{gender}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointment Stats */}
          {appointmentData && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amaranth" />
                Appointment Statistics
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">By Status</p>
                  <div className="space-y-2">
                    {Object.entries(appointmentData.distribution.byStatus).map(
                      ([status, count]: [string, any]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{status}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">By Type</p>
                  <div className="space-y-2">
                    {Object.entries(appointmentData.distribution.byType).map(
                      ([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm">{type.replace('_', ' ')}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Alerts - Only for Hospital Staff */}
      {!isSuperAdmin && inventoryData && (
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-ribbon" />
            Inventory Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Low Stock */}
            <div className="p-4 border border-saffron/20 bg-saffron/5 rounded-lg">
              <p className="text-sm font-medium mb-2">Low Stock Items</p>
              <p className="text-2xl font-bold text-saffron">
                {inventoryData.summary.lowStockCount}
              </p>
              <Link href="/inventory?filter=lowStock">
                <Button variant="ghost" size="sm" className="mt-2">
                  View Items
                </Button>
              </Link>
            </div>

            {/* Expired */}
            <div className="p-4 border border-red-ribbon/20 bg-red-ribbon/5 rounded-lg">
              <p className="text-sm font-medium mb-2">Expired Items</p>
              <p className="text-2xl font-bold text-red-ribbon">
                {inventoryData.summary.expiredCount}
              </p>
              <Link href="/inventory?filter=expired">
                <Button variant="ghost" size="sm" className="mt-2">
                  View Items
                </Button>
              </Link>
            </div>

            {/* Expiring Soon */}
            <div className="p-4 border border-saffron/20 bg-saffron/5 rounded-lg">
              <p className="text-sm font-medium mb-2">Expiring Soon (90 days)</p>
              <p className="text-2xl font-bold text-saffron">
                {inventoryData.summary.expiringSoonCount}
              </p>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="mt-2">
                  View Items
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        {isSuperAdmin ? (
          // Super Admin Quick Actions
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/hospitals">
              <Button variant="outline" className="w-full">
                <Building2 className="w-4 h-4 mr-2" />
                View Hospitals
              </Button>
            </Link>
            <Link href="/subscriptions">
              <Button variant="outline" className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                View Subscriptions
              </Button>
            </Link>
            <Link href="/super-admin">
              <Button variant="outline" className="w-full">
                <Activity className="w-4 h-4 mr-2" />
                System Overview
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                Platform Metrics
              </Button>
            </Link>
          </div>
        ) : (
          // Hospital Staff Quick Actions
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/invoices">
              <Button variant="outline" className="w-full">
                View Invoices
              </Button>
            </Link>
            <Link href="/patients">
              <Button variant="outline" className="w-full">
                View Patients
              </Button>
            </Link>
            <Link href="/appointments">
              <Button variant="outline" className="w-full">
                View Appointments
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" className="w-full">
                View Inventory
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

