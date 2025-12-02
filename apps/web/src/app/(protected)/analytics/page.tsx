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
  FileText,
  BedDouble,
  Pill,
  TestTube,
  Clock,
  Percent,
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const isSuperAdmin = session?.user?.role === 'super_admin';
  const isLoading = status === 'loading';
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
    enabled: !isLoading && isSuperAdmin,
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['analytics-subscriptions'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/subscriptions');
      return response.data;
    },
    enabled: !isLoading && isSuperAdmin,
  });

  const { data: systemData } = useQuery({
    queryKey: ['analytics-system'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/system');
      return response.data;
    },
    enabled: !isLoading && isSuperAdmin,
  });

  // Fetch comprehensive super admin analytics
  const { data: superAdminData } = useQuery({
    queryKey: ['analytics-super-admin', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const response = await axios.get(`/api/analytics/super-admin?${params}`);
      return response.data;
    },
    enabled: !isLoading && isSuperAdmin,
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
    enabled: !isLoading && !isSuperAdmin,
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
    enabled: !isLoading && !isSuperAdmin,
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
    enabled: !isLoading && !isSuperAdmin,
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['analytics-inventory'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/inventory');
      return response.data;
    },
    enabled: !isLoading && !isSuperAdmin,
  });

  // Fetch comprehensive analytics (new detailed metrics)
  const { data: comprehensiveData } = useQuery({
    queryKey: ['analytics-comprehensive', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const response = await axios.get(`/api/analytics/comprehensive?${params}`);
      return response.data;
    },
    enabled: !isLoading && !isSuperAdmin,
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
        // Super Admin - Enhanced Platform-wide metrics (6 cards)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Revenue */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <DollarSign className="w-5 h-5 text-green-haze" />
            </div>
            <p className="text-2xl font-bold">
              {superAdminData ? formatCurrency(superAdminData.topMetrics.revenue) : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>

          {/* Medical Records Made */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Medical Records</p>
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">
              {superAdminData ? superAdminData.topMetrics.medicalRecords.total.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>

          {/* Patients on Admission */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">On Admission</p>
              <BedDouble className="w-5 h-5 text-red-ribbon" />
            </div>
            <p className="text-2xl font-bold">
              {superAdminData ? superAdminData.topMetrics.admissions.total.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>

          {/* Total Invoices */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Invoices</p>
              <FileText className="w-5 h-5 text-saffron" />
            </div>
            <p className="text-2xl font-bold">
              {superAdminData ? superAdminData.topMetrics.invoices.total.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>

          {/* Total Prescriptions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Prescriptions</p>
              <Pill className="w-5 h-5 text-amaranth" />
            </div>
            <p className="text-2xl font-bold">
              {superAdminData ? superAdminData.topMetrics.prescriptions.total.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>

          {/* Total Investigations */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Investigations</p>
              <TestTube className="w-5 h-5 text-danube" />
            </div>
            <p className="text-2xl font-bold">
              {superAdminData ? superAdminData.topMetrics.investigations.total.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>
        </div>
      ) : (
        // Hospital Staff - Hospital-specific metrics (Enhanced with 6 cards)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Revenue</p>
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

          {/* Medical Records Made */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Medical Records</p>
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">
              {comprehensiveData ? comprehensiveData.metrics.medicalRecords.total.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>

          {/* Patients on Admission */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">On Admission</p>
              <BedDouble className="w-5 h-5 text-red-ribbon" />
            </div>
            <p className="text-2xl font-bold">
              {comprehensiveData ? comprehensiveData.metrics.admissions.total.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>

          {/* Total Invoices */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Invoices</p>
              <FileText className="w-5 h-5 text-saffron" />
            </div>
            <p className="text-2xl font-bold">
              {comprehensiveData ? comprehensiveData.metrics.invoices.total.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>

          {/* Total Prescriptions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Prescriptions</p>
              <Pill className="w-5 h-5 text-amaranth" />
            </div>
            <p className="text-2xl font-bold">
              {comprehensiveData ? comprehensiveData.metrics.prescriptions.total.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>

          {/* Total Investigations */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Investigations</p>
              <TestTube className="w-5 h-5 text-danube" />
            </div>
            <p className="text-2xl font-bold">
              {comprehensiveData ? comprehensiveData.metrics.investigations.total.toLocaleString() : '...'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.startDate ? 'in period' : 'last 30 days'}
            </p>
          </div>
        </div>
      )}

      {/* Breakdown Cards - HMO/Self/Corporate & Pending/Completed */}
      {!isSuperAdmin && comprehensiveData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Revenue Breakdown */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Revenue Breakdown</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">HMO</span>
                <span className="font-semibold">{comprehensiveData.metrics.medicalRecords.byType?.hmo || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Self</span>
                <span className="font-semibold">{comprehensiveData.metrics.medicalRecords.byType?.self_pay || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Corporate</span>
                <span className="font-semibold">{comprehensiveData.metrics.medicalRecords.byType?.corporate || 0}</span>
              </div>
            </div>
          </div>

          {/* Medical Records Breakdown */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Medical Records</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">HMO</span>
                <span className="font-semibold">{comprehensiveData.metrics.medicalRecords.byType?.hmo || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Self</span>
                <span className="font-semibold">{comprehensiveData.metrics.medicalRecords.byType?.self_pay || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Corporate</span>
                <span className="font-semibold">{comprehensiveData.metrics.medicalRecords.byType?.corporate || 0}</span>
              </div>
            </div>
          </div>

          {/* Admissions Breakdown */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Admissions</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">HMO</span>
                <span className="font-semibold">{comprehensiveData.metrics.admissions.byType?.hmo || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Self</span>
                <span className="font-semibold">{comprehensiveData.metrics.admissions.byType?.self_pay || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Corporate</span>
                <span className="font-semibold">{comprehensiveData.metrics.admissions.byType?.corporate || 0}</span>
              </div>
            </div>
          </div>

          {/* Invoices Status */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Invoices Status</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Pending</span>
                <span className="font-semibold">{comprehensiveData.metrics.invoices.byStatus?.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Paid</span>
                <span className="font-semibold">{comprehensiveData.metrics.invoices.byStatus?.paid || 0}</span>
              </div>
            </div>
          </div>

          {/* Prescriptions Status */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Prescriptions Status</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Active</span>
                <span className="font-semibold">{comprehensiveData.metrics.prescriptions.byStatus?.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Completed</span>
                <span className="font-semibold">{comprehensiveData.metrics.prescriptions.byStatus?.completed || 0}</span>
              </div>
            </div>
          </div>

          {/* Investigations Status */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Investigations Status</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Pending</span>
                <span className="font-semibold">{comprehensiveData.metrics.investigations.byStatus?.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Completed</span>
                <span className="font-semibold">{comprehensiveData.metrics.investigations.byStatus?.completed || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin - Breakdown Cards */}
      {isSuperAdmin && superAdminData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Revenue Breakdown */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Revenue Breakdown</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">HMO</span>
                <span className="font-semibold">{superAdminData.topMetrics.medicalRecords.byType?.hmo || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Self</span>
                <span className="font-semibold">{superAdminData.topMetrics.medicalRecords.byType?.self_pay || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Corporate</span>
                <span className="font-semibold">{superAdminData.topMetrics.medicalRecords.byType?.corporate || 0}</span>
              </div>
            </div>
          </div>

          {/* Medical Records Breakdown */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Medical Records</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">HMO</span>
                <span className="font-semibold">{superAdminData.topMetrics.medicalRecords.byType?.hmo || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Self</span>
                <span className="font-semibold">{superAdminData.topMetrics.medicalRecords.byType?.self_pay || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Corporate</span>
                <span className="font-semibold">{superAdminData.topMetrics.medicalRecords.byType?.corporate || 0}</span>
              </div>
            </div>
          </div>

          {/* Admissions Breakdown */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Admissions</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">HMO</span>
                <span className="font-semibold">{superAdminData.topMetrics.admissions.byType?.hmo || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Self</span>
                <span className="font-semibold">{superAdminData.topMetrics.admissions.byType?.self_pay || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Corporate</span>
                <span className="font-semibold">{superAdminData.topMetrics.admissions.byType?.corporate || 0}</span>
              </div>
            </div>
          </div>

          {/* Invoices Status */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Invoices Status</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Pending</span>
                <span className="font-semibold">{superAdminData.topMetrics.invoices.byStatus?.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Paid</span>
                <span className="font-semibold">{superAdminData.topMetrics.invoices.byStatus?.paid || 0}</span>
              </div>
            </div>
          </div>

          {/* Prescriptions Status */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Prescriptions Status</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Active</span>
                <span className="font-semibold">{superAdminData.topMetrics.prescriptions.byStatus?.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Completed</span>
                <span className="font-semibold">{superAdminData.topMetrics.prescriptions.byStatus?.completed || 0}</span>
              </div>
            </div>
          </div>

          {/* Investigations Status */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-xs font-semibold text-green-800 mb-3">Investigations Status</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Pending</span>
                <span className="font-semibold">{superAdminData.topMetrics.investigations.byStatus?.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Completed</span>
                <span className="font-semibold">{superAdminData.topMetrics.investigations.byStatus?.completed || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin - Analysis Cards */}
      {isSuperAdmin && superAdminData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Top 5 HMO Clients */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Top 5 HMO Clients
            </h2>
            <div className="space-y-3">
              {superAdminData.analytics.topHMOClients && superAdminData.analytics.topHMOClients.length > 0 ? (
                superAdminData.analytics.topHMOClients.map((client: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded">
                    <p className="font-medium text-sm">{client.hmo_name}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>{client.invoice_count} invoices</span>
                      <span className="font-bold text-primary">{formatCurrency(Number(client.total_revenue))}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No HMO data</p>
              )}
            </div>
          </div>

          {/* Top 5 Diagnoses */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amaranth" />
              Top 5 Diagnoses
            </h2>
            <div className="space-y-2">
              {superAdminData.analytics.topDiagnoses && superAdminData.analytics.topDiagnoses.length > 0 ? (
                superAdminData.analytics.topDiagnoses.map((diag: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded">
                    <span className="text-sm truncate flex-1">{diag.diagnosis}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{diag.count}</span>
                      <span className="text-sm font-semibold text-amaranth">{Number(diag.percentage).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No diagnosis data</p>
              )}
            </div>
          </div>

          {/* Total Claims by Facility */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-haze" />
              Claims by Facility
            </h2>
            <div className="space-y-2">
              {superAdminData.analytics.claimsByFacility && superAdminData.analytics.claimsByFacility.length > 0 ? (
                superAdminData.analytics.claimsByFacility.slice(0, 5).map((facility: any, idx: number) => (
                  <div key={idx} className="p-2 bg-muted/30 rounded">
                    <p className="text-sm font-medium">{facility.hospital_name}</p>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{facility.claim_count} claims</span>
                      <span className="font-bold">{formatCurrency(Number(facility.total_amount))}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No claims data</p>
              )}
            </div>
          </div>

          {/* Patient Type Distribution */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-danube" />
              Patient Type Distribution
            </h2>
            <div className="space-y-3">
              {superAdminData.analytics.patientTypeDistribution && superAdminData.analytics.patientTypeDistribution.length > 0 ? (
                superAdminData.analytics.patientTypeDistribution.map((type: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <span className="text-sm capitalize">{type.patient_type.replace('_', ' ')}</span>
                    <span className="text-lg font-bold text-primary">{Number(type.percentage).toFixed(1)}%</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No distribution data</p>
              )}
            </div>
          </div>

          {/* Top 5 Drug Categories */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-amaranth" />
              Top 5 Drug Categories
            </h2>
            <div className="space-y-2">
              {superAdminData.analytics.topDrugCategories && superAdminData.analytics.topDrugCategories.length > 0 ? (
                superAdminData.analytics.topDrugCategories.map((drug: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded">
                    <span className="text-sm truncate flex-1">{drug.drug_category || 'Unknown'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{drug.count}</span>
                      <span className="text-sm font-semibold text-amaranth">{Number(drug.percentage).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No drug data</p>
              )}
            </div>
          </div>

          {/* Top 5 Lab Test Areas */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TestTube className="w-5 h-5 text-danube" />
              Top 5 Lab Test Areas
            </h2>
            <div className="space-y-2">
              {superAdminData.analytics.topLabTests && superAdminData.analytics.topLabTests.length > 0 ? (
                superAdminData.analytics.topLabTests.map((test: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded">
                    <span className="text-sm truncate flex-1">{test.order_type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{test.count}</span>
                      <span className="text-sm font-semibold text-danube">{Number(test.percentage).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No lab test data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Super Admin - Clinical Analytics */}
      {isSuperAdmin && superAdminData && (
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-primary mb-4">Clinical Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Prescription Rate */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Prescription Rate Per Hospital</h3>
              <div className="space-y-2">
                {superAdminData.clinicalAnalytics.prescriptionRates && superAdminData.clinicalAnalytics.prescriptionRates.length > 0 ? (
                  superAdminData.clinicalAnalytics.prescriptionRates.slice(0, 5).map((hosp: any, idx: number) => (
                    <div key={idx} className="text-xs p-2 bg-muted/30 rounded">
                      <p className="font-medium">{hosp.hospital_name}</p>
                      <p className="text-muted-foreground">{Number(hosp.rate).toFixed(2)} per patient</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </div>
            </div>

            {/* Antibiotics Rate */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Antibiotics Rate Per Hospital</h3>
              <div className="space-y-2">
                {superAdminData.clinicalAnalytics.antibioticsRates && superAdminData.clinicalAnalytics.antibioticsRates.length > 0 ? (
                  superAdminData.clinicalAnalytics.antibioticsRates.slice(0, 5).map((hosp: any, idx: number) => (
                    <div key={idx} className="text-xs p-2 bg-muted/30 rounded">
                      <p className="font-medium">{hosp.hospital_name}</p>
                      <p className="text-muted-foreground">{Number(hosp.percentage).toFixed(1)}%</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </div>
            </div>

            {/* Admission Rates */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Admission Rates</h3>
              <div className="space-y-2">
                {superAdminData.clinicalAnalytics.admissionRates && superAdminData.clinicalAnalytics.admissionRates.length > 0 ? (
                  superAdminData.clinicalAnalytics.admissionRates.slice(0, 5).map((hosp: any, idx: number) => (
                    <div key={idx} className="text-xs p-2 bg-muted/30 rounded">
                      <p className="font-medium">{hosp.hospital_name}</p>
                      <p className="text-muted-foreground">{hosp.admission_count} admissions</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </div>
            </div>

            {/* Discharge Rates */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Discharge Rates</h3>
              <div className="space-y-2">
                {superAdminData.clinicalAnalytics.dischargeRates && superAdminData.clinicalAnalytics.dischargeRates.length > 0 ? (
                  superAdminData.clinicalAnalytics.dischargeRates.slice(0, 5).map((hosp: any, idx: number) => (
                    <div key={idx} className="text-xs p-2 bg-muted/30 rounded">
                      <p className="font-medium">{hosp.hospital_name}</p>
                      <p className="text-muted-foreground">{Number(hosp.discharge_rate).toFixed(1)}%</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin - Demographics */}
      {isSuperAdmin && superAdminData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Age Distribution */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Patient Age Distribution
            </h2>
            <div className="space-y-3">
              {superAdminData.demographics.ageDistribution && superAdminData.demographics.ageDistribution.length > 0 ? (
                superAdminData.demographics.ageDistribution.map((age: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <span className="text-sm font-medium">{age.age_group} years</span>
                    <span className="text-lg font-bold text-primary">{Number(age.count)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No age data</p>
              )}
            </div>
          </div>

          {/* Average Time Per User */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-saffron" />
              Average Time on System
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {superAdminData.demographics.timeTracking && superAdminData.demographics.timeTracking.length > 0 ? (
                superAdminData.demographics.timeTracking.map((user: any, idx: number) => (
                  <div key={idx} className="text-xs p-2 bg-muted/30 rounded">
                    <p className="font-medium">{user.user_name} ({user.role})</p>
                    <p className="text-muted-foreground">{user.hospital_name}</p>
                    <p className="text-primary font-semibold">{Number(user.avg_hours).toFixed(1)} hours avg</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No time tracking data</p>
              )}
            </div>
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
        </>
      )}

      {/* Large Analysis Cards - Top 5s and Percentages */}
      {!isSuperAdmin && comprehensiveData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Top 5 HMO Clients */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Top 5 HMO Clients
            </h2>
            <div className="space-y-3">
              {comprehensiveData.analytics.topHMOClients && comprehensiveData.analytics.topHMOClients.length > 0 ? (
                comprehensiveData.analytics.topHMOClients.map((client: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{client.hmo_name || 'Unknown HMO'}</p>
                      <p className="text-xs text-muted-foreground">{client.invoice_count} invoices</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(Number(client.total_revenue))}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No HMO data available</p>
              )}
            </div>
          </div>

          {/* Total Claims Submitted */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-haze" />
              Total Claims Submitted
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded">
                <p className="text-sm text-muted-foreground mb-1">Total Claims</p>
                <p className="text-3xl font-bold text-green-800">
                  {comprehensiveData.analytics.claims.total_claims?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="p-4 bg-primary/10 rounded">
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(Number(comprehensiveData.analytics.claims.total_claimed_amount || 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Top 5 Diagnosis */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amaranth" />
              Top 5 Diagnoses
            </h2>
            <div className="space-y-2">
              {comprehensiveData.analytics.topDiagnoses && comprehensiveData.analytics.topDiagnoses.length > 0 ? (
                comprehensiveData.analytics.topDiagnoses.map((diag: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded">
                    <span className="text-sm truncate flex-1">{diag.diagnosis}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{diag.count}</span>
                      <span className="text-sm font-semibold text-amaranth">{Number(diag.percentage).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No diagnosis data</p>
              )}
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-danube" />
              Payment Method %
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-pink-50 rounded">
                <span className="text-sm">HMO</span>
                <span className="text-lg font-semibold text-pink-600">
                  {comprehensiveData.metrics.medicalRecords.byType?.hmo || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="text-sm">Self Pay</span>
                <span className="text-lg font-semibold text-blue-600">
                  {comprehensiveData.metrics.medicalRecords.byType?.self_pay || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                <span className="text-sm">Corporate</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {comprehensiveData.metrics.medicalRecords.byType?.corporate || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Top 5 Drug Categories */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-amaranth" />
              Top 5 Drug Categories
            </h2>
            <div className="space-y-2">
              {comprehensiveData.analytics.topDrugCategories && comprehensiveData.analytics.topDrugCategories.length > 0 ? (
                comprehensiveData.analytics.topDrugCategories.map((drug: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded">
                    <span className="text-sm truncate flex-1">{drug.drug_category || 'Unknown'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{drug.count}</span>
                      <span className="text-sm font-semibold text-amaranth">{Number(drug.percentage).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No drug data</p>
              )}
            </div>
          </div>

          {/* Top 5 Lab Test Areas */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TestTube className="w-5 h-5 text-danube" />
              Top 5 Lab Test Areas
            </h2>
            <div className="space-y-2">
              {comprehensiveData.analytics.topLabTests && comprehensiveData.analytics.topLabTests.length > 0 ? (
                comprehensiveData.analytics.topLabTests.map((test: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded">
                    <span className="text-sm truncate flex-1">{test.order_type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{test.count}</span>
                      <span className="text-sm font-semibold text-danube">{Number(test.percentage).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No lab test data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Age Distribution & Time Tracking */}
      {!isSuperAdmin && comprehensiveData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Age Distribution */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Patient Age Distribution
            </h2>
            <div className="space-y-3">
              {comprehensiveData.analytics.patientAgeDistribution && comprehensiveData.analytics.patientAgeDistribution.length > 0 ? (
                comprehensiveData.analytics.patientAgeDistribution.map((age: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <span className="text-sm font-medium">{age.age_group} years</span>
                    <span className="text-lg font-bold text-primary">{Number(age.count)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No age data available</p>
              )}
            </div>
          </div>

          {/* Average Time Per Section */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-saffron" />
              Average Time Per Section
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Front Desk (Check-in to Vitals)</span>
                  <span className="font-semibold text-blue-600">
                    {comprehensiveData?.analytics.timeTracking?.frontDesk 
                      ? `${comprehensiveData.analytics.timeTracking.frontDesk.toFixed(1)} min` 
                      : 'No data'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Nursing Station (Vitals to Doctor)</span>
                  <span className="font-semibold text-green-600">
                    {comprehensiveData?.analytics.timeTracking?.nursing 
                      ? `${comprehensiveData.analytics.timeTracking.nursing.toFixed(1)} min` 
                      : 'No data'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Doctor Consultation</span>
                  <span className="font-semibold text-purple-600">
                    {comprehensiveData?.analytics.timeTracking?.consultation 
                      ? `${comprehensiveData.analytics.timeTracking.consultation.toFixed(1)} min` 
                      : 'No data'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Investigation (Lab Tests)</span>
                  <span className="font-semibold text-yellow-600">
                    {comprehensiveData?.analytics.timeTracking?.investigation 
                      ? `${comprehensiveData.analytics.timeTracking.investigation.toFixed(1)} min` 
                      : 'No data'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-pink-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pharmacy (Dispensing)</span>
                  <span className="font-semibold text-pink-600">
                    {comprehensiveData?.analytics.timeTracking?.pharmacy 
                      ? `${comprehensiveData.analytics.timeTracking.pharmacy.toFixed(1)} min` 
                      : 'No data'}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/30 rounded">
                <p className="text-xs text-muted-foreground text-center">
                  Calculated from appointment timestamps (check-in to checkout)
                </p>
              </div>
            </div>
          </div>
        </div>
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

