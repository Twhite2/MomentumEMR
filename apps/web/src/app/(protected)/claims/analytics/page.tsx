'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Select } from '@momentum/ui';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

export default function ClaimsAnalyticsPage() {
  const [hmoFilter, setHmoFilter] = useState('');
  const [dateRange, setDateRange] = useState('thisMonth');

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last3Months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        endDate = today;
        break;
      case 'last6Months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        endDate = today;
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  };

  const dates = getDateRange();

  // Fetch analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['claims-analytics', hmoFilter, dates.start, dates.end],
    queryFn: async () => {
      let url = `/api/claims/analytics?startDate=${dates.start}&endDate=${dates.end}`;
      if (hmoFilter) url += `&hmoId=${hmoFilter}`;
      const response = await axios.get(url);
      return response.data;
    },
  });

  // Fetch HMOs for filter
  const { data: hmosData } = useQuery({
    queryKey: ['hmos-list'],
    queryFn: async () => {
      const response = await axios.get('/api/hmo');
      return response.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const summary = analytics?.summary || {};
  const byHmo = analytics?.byHmo || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/claims">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Claims Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Track HMO claims performance and revenue
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Date Range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="last3Months">Last 3 Months</option>
            <option value="last6Months">Last 6 Months</option>
          </Select>

          <Select
            label="HMO"
            value={hmoFilter}
            onChange={(e) => setHmoFilter(e.target.value)}
          >
            <option value="">All HMOs</option>
            {hmosData?.hmos?.map((hmo: any) => (
              <option key={hmo.id} value={hmo.id}>
                {hmo.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-tory-blue/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-tory-blue" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Claims</p>
              <p className="text-2xl font-bold">{summary.totalClaims || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(summary.totalAmount || 0)}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-haze/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-haze" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Paid Claims</p>
              <p className="text-2xl font-bold text-green-haze">{summary.paid?.count || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(summary.paid?.amount || 0)}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-red-ribbon/10 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-ribbon" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Denied Claims</p>
              <p className="text-2xl font-bold text-red-ribbon">{summary.denied?.count || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(summary.denied?.amount || 0)}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-danube/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-danube" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-danube">{summary.outstanding?.count || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(summary.outstanding?.amount || 0)}
              </p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Claims by Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-tory-blue/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-tory-blue" />
                    <span className="text-sm font-medium">Submitted</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{summary.submitted?.count || 0}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(summary.submitted?.amount || 0)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-saffron/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-saffron" />
                    <span className="text-sm font-medium">Disputed</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{summary.disputed?.count || 0}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(summary.disputed?.amount || 0)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Queried</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{summary.queried?.count || 0}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(summary.queried?.amount || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
              <div className="space-y-4">
                <div className="p-4 bg-spindle/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Submitted</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount || 0)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Received</p>
                  <p className="text-2xl font-bold text-green-haze">{formatCurrency(summary.paid?.amount || 0)}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Outstanding</p>
                  <p className="text-2xl font-bold text-red-ribbon">
                    {formatCurrency((summary.totalAmount || 0) - (summary.paid?.amount || 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* HMO Performance Table */}
          <div className="bg-white rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Performance by HMO</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-spindle/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      HMO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Total Claims
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Denied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Outstanding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Payment Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {byHmo.map((hmo: any) => (
                    <tr key={hmo.hmoId} className="hover:bg-spindle/20">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{hmo.hmoName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{hmo.totalClaims}</div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(hmo.totalAmount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-haze">{hmo.paid.count}</div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(hmo.paid.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-ribbon">{hmo.denied.count}</div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(hmo.denied.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-danube">{hmo.outstanding.count}</div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(hmo.outstandingAmount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{hmo.paymentRate}%</div>
                          {hmo.paymentRate >= 70 ? (
                            <TrendingUp className="w-4 h-4 text-green-haze" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-ribbon" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
