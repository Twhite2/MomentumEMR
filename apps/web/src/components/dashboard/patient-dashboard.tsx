'use client';

import { StatCard } from './stat-card';
import { Calendar, FileText, DollarSign, TestTube } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PatientDashboardProps {
  session: Session;
}

export default function PatientDashboard({ session }: PatientDashboardProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground mt-1">Patient Portal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Appointment */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Next Appointment</h2>
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="font-medium">Dr. Sarah Johnson</p>
            <p className="text-sm text-muted-foreground mt-1">Cardiology Consultation</p>
            <p className="text-sm text-muted-foreground mt-2">
              📅 Tomorrow, 9:00 AM - 9:30 AM
            </p>
            <p className="text-sm text-muted-foreground">📍 City General Hospital, Room 204</p>
            <div className="mt-4 flex gap-2">
              <Link href="/appointments">
                <button className="text-sm bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                  View Details
                </button>
              </Link>
              <Link href="/appointments">
                <button className="text-sm border border-border px-4 py-2 rounded hover:bg-muted">
                  Reschedule
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Lab Results */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Lab Results</h2>
            <TestTube className="w-5 h-5 text-green-haze" />
          </div>
          <div className="space-y-3">
            <Link href="/lab-results">
              <div className="p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <p className="font-medium text-sm">Complete Blood Count</p>
                <p className="text-xs text-muted-foreground mt-1">Date: Dec 25, 2025</p>
                <p className="text-xs text-primary hover:underline mt-2">
                  Download PDF →
                </p>
              </div>
            </Link>
            <Link href="/lab-results">
              <div className="p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <p className="font-medium text-sm">Chest X-Ray</p>
                <p className="text-xs text-muted-foreground mt-1">Date: Dec 20, 2025</p>
                <p className="text-xs text-primary hover:underline mt-2">
                  View Images →
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Billing Summary</h2>
          <DollarSign className="w-5 h-5 text-saffron" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-haze/5 border border-green-haze/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
            <p className="text-2xl font-bold text-foreground mt-1">₦0</p>
            <p className="text-xs text-green-haze mt-2">✓ All paid</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Last Payment</p>
            <p className="text-2xl font-bold text-foreground mt-1">₦25,000</p>
            <p className="text-xs text-muted-foreground mt-2">Dec 15, 2025</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Insurance Coverage</p>
            <p className="text-lg font-bold text-foreground mt-1">Premium Health Plus</p>
            <p className="text-xs text-muted-foreground mt-2">Provider: HealthGuard</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/appointments/new">
            <div className="p-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-center cursor-pointer">
              <Calendar className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Book Appointment</p>
            </div>
          </Link>
          <Link href="/prescriptions">
            <div className="p-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-center cursor-pointer">
              <FileText className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Prescriptions</p>
            </div>
          </Link>
          <Link href="/lab-results">
            <div className="p-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-center cursor-pointer">
              <TestTube className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Lab Results</p>
            </div>
          </Link>
          <Link href="/billing">
            <div className="p-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-center cursor-pointer">
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Pay Bills</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

