'use client';

import { StatCard } from './stat-card';
import { Pill, AlertTriangle, ShoppingCart } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';

interface PharmacistDashboardProps {
  session: Session;
}

export default function PharmacistDashboard({ session }: PharmacistDashboardProps) {
  const stats = {
    pendingPrescriptions: 15,
    stockAlerts: 3,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground mt-1">Pharmacist Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/prescriptions">
          <StatCard title="Pending Prescriptions" value={stats.pendingPrescriptions} icon={Pill} color="blue" />
        </Link>
        <Link href="/inventory">
          <StatCard title="Stock Alerts" value={stats.stockAlerts} icon={AlertTriangle} color="red" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Prescription Queue</h2>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">Prescription #RX-2025-001</p>
              <p className="text-xs text-muted-foreground mt-1">Patient: John Doe</p>
              <p className="text-xs text-muted-foreground">Items: 3 medications</p>
              <button className="text-xs text-tory-blue hover:underline mt-2">Dispense →</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Drug Inventory</h2>
          <div className="space-y-3">
            <div className="p-3 bg-red-ribbon/5 border border-red-ribbon/20 rounded-lg">
              <p className="text-sm font-medium">Insulin Syringes</p>
              <p className="text-xs text-muted-foreground">8 units - Reorder now</p>
            </div>
            <div className="p-3 bg-saffron/5 border border-saffron/20 rounded-lg">
              <p className="text-sm font-medium">Amoxicillin 250mg</p>
              <p className="text-xs text-muted-foreground">300 units - Low stock</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
