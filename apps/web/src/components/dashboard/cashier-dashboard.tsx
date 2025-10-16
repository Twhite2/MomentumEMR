'use client';

import { StatCard } from './stat-card';
import { DollarSign, FileText } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';

interface CashierDashboardProps {
  session: Session;
}

export default function CashierDashboard({ session }: CashierDashboardProps) {
  const stats = {
    todayRevenue: 450000,
    pendingInvoices: 8,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground mt-1">Cashier Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/billing">
          <StatCard
            title="Today's Revenue"
            value={`₦${(stats.todayRevenue / 1000).toFixed(0)}K`}
            icon={DollarSign}
            color="green"
          />
        </Link>
        <Link href="/invoices">
          <StatCard title="Pending Invoices" value={stats.pendingInvoices} icon={FileText} color="yellow" />
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium text-sm">Invoice #INV-2025-123</p>
              <p className="text-xs text-muted-foreground">Patient: John Doe</p>
            </div>
            <span className="text-sm font-semibold text-green-haze">₦25,000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
