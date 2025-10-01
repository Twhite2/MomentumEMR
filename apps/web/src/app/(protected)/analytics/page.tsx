'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import {
  TrendingUp,
  Users,
  Calendar,
  Package,
  DollarSign,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // Fetch all analytics data
  const { data: revenueData } = useQuery({
    queryKey: ['analytics-revenue', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const response = await axios.get(`/api/analytics/revenue?${params}`);
      return response.data;
    },
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
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['analytics-inventory'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/inventory');
      return response.data;
    },
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
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
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

      {/* Key Metrics */}
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
            <Users className="w-5 h-5 text-tory-blue" />
          </div>
          <p className="text-2xl font-bold">
            {patientData ? patientData.summary.totalPatients.toLocaleString() : '...'}
          </p>
          <p className="text-sm text-tory-blue mt-1">
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

      {/* Revenue Breakdown */}
      {revenueData && (
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

      {/* Patient & Appointment Stats */}
      {(patientData || appointmentData) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Distribution */}
          {patientData && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-tory-blue" />
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

      {/* Inventory Alerts */}
      {inventoryData && (
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
      </div>
    </div>
  );
}
