'use client';

import { useQuery } from '@tanstack/react-query';
import { Session } from 'next-auth';
import Link from 'next/link';
import axios from 'axios';
import { 
  Users, Calendar, DollarSign, Package, UserPlus, 
  TrendingUp, AlertTriangle, BedDouble, LogOut,
  ShoppingCart, Receipt, UserCog
} from 'lucide-react';
import { Button } from '@momentum/ui';

interface AdminDashboardProps {
  session: Session;
}

export default function AdminDashboardComprehensive({ session }: AdminDashboardProps) {
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
        <div className="bg-yellow-500 text-black px-6 py-4 rounded-lg">
          <h1 className="text-xl font-bold text-center">Hospital Admin Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Prepare pie chart data
  const hmoPercentage = stats?.patientTypeBreakdown?.hmo?.percentage || 0;
  const corporatePercentage = stats?.patientTypeBreakdown?.corporate?.percentage || 0;
  const selfPayPercentage = stats?.patientTypeBreakdown?.self_pay?.percentage || 0;

  // Mock revenue trend data (in real app, this would come from API)
  const revenueCategories = ['HMO', 'Corporate', 'Self-pay'];
  const revenueColors = ['#FF69B4', '#FFD700', '#00C853'];

  // Mock patient inflow data (in real app, this would come from API)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const patientInflowData = [
    { opd: 20, opdNew: 15, opdRevisit: 15 },
    { opd: 25, opdNew: 20, opdRevisit: 20 },
    { opd: 30, opdNew: 25, opdRevisit: 25 },
    { opd: 28, opdNew: 22, opdRevisit: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-yellow-500 text-black px-6 py-4 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Hospital Admin Dashboard</h1>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total Patients */}
        <Link href="/patients">
          <div className="bg-primary text-white p-4 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity">
            <div className="text-center">
              <p className="text-sm mb-2">Total patients</p>
              <p className="text-sm mb-1">Type: number</p>
              <p className="text-3xl font-bold">{stats?.totalPatients?.toLocaleString() || 0}</p>
            </div>
          </div>
        </Link>

        {/* Total Staff */}
        <Link href="/users">
          <div className="bg-primary text-white p-4 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity">
            <div className="text-center">
              <p className="text-sm mb-2">Total Staff: number</p>
              <p className="text-3xl font-bold">{stats?.totalStaff || 0}</p>
            </div>
          </div>
        </Link>

        {/* Appointments Today */}
        <Link href="/appointments">
          <div className="bg-primary text-white p-4 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity">
            <div className="text-center">
              <p className="text-sm mb-2">Appointments today:</p>
              <p className="text-sm mb-1">number</p>
              <p className="text-3xl font-bold">{stats?.todayAppointments || 0}</p>
            </div>
          </div>
        </Link>

        {/* Total Revenue Today */}
        <Link href="/invoices">
          <div className="bg-primary text-white p-4 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity">
            <div className="text-center">
              <p className="text-xs mb-2">Total revenue today (pending plus actual: number)</p>
              <div className="mt-2">
                <p className="text-lg font-bold">₦{((stats?.revenueTodayTotal || 0) / 1000).toFixed(1)}K</p>
                <p className="text-xs">Paid: ₦{((stats?.revenueTodayPaid || 0) / 1000).toFixed(1)}K</p>
                <p className="text-xs">Pending: ₦{((stats?.revenueTodayPending || 0) / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Inventory Value */}
        <Link href="/inventory">
          <div className="bg-primary text-white p-4 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity">
            <div className="text-center">
              <p className="text-xs mb-2">Inventory value amount and number of items</p>
              <div className="mt-2">
                <p className="text-lg font-bold">₦{((stats?.inventoryTotalValue || 0) / 1000).toFixed(0)}K</p>
                <p className="text-xs">{stats?.inventoryTotalItems || 0} items</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Middle Section: Patient Breakdown, Low Stock, Action Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Type Breakdown - Pie Chart */}
        <div className="bg-white p-6 rounded-lg border border-border">
          <h2 className="text-base font-semibold mb-4">Patient type breakdown: pie chart (HMO, Corporate and self pay)</h2>
          <div className="relative">
            {/* Simple CSS Pie Chart */}
            <div className="w-48 h-48 mx-auto rounded-full" style={{
              background: `conic-gradient(
                #00C853 0deg ${selfPayPercentage * 3.6}deg,
                #FFD700 ${selfPayPercentage * 3.6}deg ${(selfPayPercentage + corporatePercentage) * 3.6}deg,
                #FF69B4 ${(selfPayPercentage + corporatePercentage) * 3.6}deg 360deg
              )`
            }}></div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#FF69B4]"></div>
                <span>HMO: {hmoPercentage}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#FFD700]"></div>
                <span>Corporate: {corporatePercentage}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#00C853]"></div>
                <span>Self Pay: {selfPayPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-lg border border-border lg:col-span-1">
          <div className="bg-primary text-white p-4 rounded-2xl">
            <h2 className="text-sm font-semibold text-center mb-4">Low stock alert should have 3 sections with top five low stocks</h2>
            <div className="space-y-3">
              {/* Pharmacy Low Stock */}
              <div className="bg-green-600 text-white px-4 py-3 rounded-2xl">
                <p className="text-xs font-semibold text-center">Pharmacy low stock item, top 3</p>
                <div className="mt-2 space-y-1 text-xs">
                  {stats?.pharmacyLowStock?.length > 0 ? (
                    stats.pharmacyLowStock.map((item: any, idx: number) => (
                      <p key={idx} className="truncate">• {item.item_name} ({item.stock_quantity})</p>
                    ))
                  ) : (
                    <p className="text-center opacity-75">All stocked</p>
                  )}
                </div>
              </div>

              {/* Lab Low Stock */}
              <div className="bg-green-600 text-white px-4 py-3 rounded-2xl">
                <p className="text-xs font-semibold text-center">Lab low stock item, top 3</p>
                <div className="mt-2 space-y-1 text-xs">
                  {stats?.labLowStock?.length > 0 ? (
                    stats.labLowStock.map((item: any, idx: number) => (
                      <p key={idx} className="truncate">• {item.item_name} ({item.stock_quantity})</p>
                    ))
                  ) : (
                    <p className="text-center opacity-75">All stocked</p>
                  )}
                </div>
              </div>

              {/* Nurses Low Stock */}
              <div className="bg-green-600 text-white px-4 py-3 rounded-2xl">
                <p className="text-xs font-semibold text-center">Nurses low stock item, top 3</p>
                <div className="mt-2 space-y-1 text-xs">
                  {stats?.nurseLowStock?.length > 0 ? (
                    stats.nurseLowStock.map((item: any, idx: number) => (
                      <p key={idx} className="truncate">• {item.item_name} ({item.stock_quantity})</p>
                    ))
                  ) : (
                    <p className="text-center opacity-75">All stocked</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/users">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl py-6">
              <UserCog className="w-5 h-5 mr-2" />
              manage users
            </Button>
          </Link>
          <Link href="/inventory">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl py-6">
              <Package className="w-5 h-5 mr-2" />
              check inventory
            </Button>
          </Link>
          <Link href="/invoices">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl py-6">
              <Receipt className="w-5 h-5 mr-2" />
              Billing and invoices
            </Button>
          </Link>
          <Link href="/patient-queue">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl py-6">
              <Users className="w-5 h-5 mr-2" />
              Patient's Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-lg border border-border">
          <h2 className="text-base font-semibold mb-4">Revenue trend for each category</h2>
          <div className="h-64 relative">
            <p className="text-xs text-muted-foreground mb-2 text-center">Chart visualization - Revenue by category over months</p>
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
            {/* Placeholder for actual chart library */}
            <div className="h-48 border border-border rounded flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Line chart: Jan-June revenue trends</p>
            </div>
          </div>
        </div>

        {/* Patient Inflow Chart */}
        <div className="bg-white p-6 rounded-lg border border-border">
          <h2 className="text-base font-semibold mb-4">Patient inflow (total number of patients new and old)</h2>
          <div className="h-64 relative">
            <div className="flex justify-center gap-4 mb-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span>OPD/NEW</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>OPD/NEW</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>OPD/REVISIT</span>
              </div>
            </div>
            {/* Placeholder for stacked bar chart */}
            <div className="h-48 border border-border rounded flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Stacked bar chart: Mon-Thu patient inflow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-primary text-white p-6 rounded-2xl">
          <div className="text-center">
            <p className="text-sm mb-2">Total admissions today</p>
            <p className="text-4xl font-bold">{stats?.admissionsToday || 0}</p>
          </div>
        </div>
        <div className="bg-primary text-white p-6 rounded-2xl">
          <div className="text-center">
            <p className="text-sm mb-2">Total discharges today</p>
            <p className="text-4xl font-bold">{stats?.dischargesToday || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
