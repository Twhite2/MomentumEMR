'use client';

import { StatCard } from './stat-card';
import { Calendar, TestTube, UserCheck, FileText, Pill, Clock } from 'lucide-react';
import { Session } from 'next-auth';

interface DoctorDashboardProps {
  session: Session;
}

export default function DoctorDashboard({ session }: DoctorDashboardProps) {
  // TODO: Fetch real data from API
  const stats = {
    todayAppointments: 12,
    pendingLabResults: 5,
    followUpsDue: 8,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Good morning, {session.user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Doctor Dashboard - {session.user.hospitalName}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Pending Lab Results"
          value={stats.pendingLabResults}
          icon={TestTube}
          color="yellow"
        />
        <StatCard
          title="Follow-ups Due"
          value={stats.followUpsDue}
          icon={UserCheck}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-spindle/30 transition-colors cursor-pointer">
              <div className="flex-shrink-0 w-12 h-12 bg-tory-blue/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-tory-blue" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">John Doe</p>
                  <span className="text-xs bg-green-haze/10 text-green-haze px-2 py-1 rounded">
                    Scheduled
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  OPD - Cardiology • 09:00 AM
                </p>
                <p className="text-xs text-muted-foreground">Patient ID: P-2025-001</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-spindle/30 transition-colors cursor-pointer">
              <div className="flex-shrink-0 w-12 h-12 bg-saffron/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-saffron" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">Mary Smith</p>
                  <span className="text-xs bg-saffron/10 text-saffron px-2 py-1 rounded">
                    Checked-in
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Follow-up • 10:30 AM
                </p>
                <p className="text-xs text-muted-foreground">Patient ID: P-2025-045</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-spindle/30 transition-colors cursor-pointer">
              <div className="flex-shrink-0 w-12 h-12 bg-danube/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-danube" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">Ahmed Ibrahim</p>
                  <span className="text-xs bg-spindle text-tory-blue px-2 py-1 rounded">
                    Upcoming
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  OPD - General • 02:00 PM
                </p>
                <p className="text-xs text-muted-foreground">Patient ID: P-2025-123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Result Notifications */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Lab Results Ready</h2>
            <TestTube className="w-5 h-5 text-green-haze" />
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-green-haze/5 border border-green-haze/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">John Doe - Blood Work</p>
                <span className="text-xs text-green-haze font-semibold">NEW</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Complete Blood Count • Uploaded 10 min ago
              </p>
              <button className="text-xs text-tory-blue hover:underline mt-2">
                View Results →
              </button>
            </div>

            <div className="p-3 bg-green-haze/5 border border-green-haze/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Sarah Williams - X-Ray</p>
                <span className="text-xs text-green-haze font-semibold">NEW</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Chest X-Ray • Uploaded 1 hour ago
              </p>
              <button className="text-xs text-tory-blue hover:underline mt-2">
                View Results →
              </button>
            </div>

            <div className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Ahmed Ibrahim - CT Scan</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Pending approval • Uploaded yesterday
              </p>
              <button className="text-xs text-tory-blue hover:underline mt-2">
                View & Approve →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pharmacy Inventory Widget */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pharmacy Inventory Status</h2>
          <Pill className="w-5 h-5 text-tory-blue" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-haze/5 border border-green-haze/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Paracetamol 500mg</p>
              <span className="text-xs bg-green-haze text-white px-2 py-1 rounded">In Stock</span>
            </div>
            <p className="text-xs text-muted-foreground">500 units available</p>
            <div className="mt-2 w-full bg-muted h-1.5 rounded-full">
              <div className="bg-green-haze h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="p-4 bg-saffron/5 border border-saffron/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Amoxicillin 250mg</p>
              <span className="text-xs bg-saffron text-black px-2 py-1 rounded">Low Stock</span>
            </div>
            <p className="text-xs text-muted-foreground">300 units remaining</p>
            <div className="mt-2 w-full bg-muted h-1.5 rounded-full">
              <div className="bg-saffron h-1.5 rounded-full" style={{ width: '37.5%' }}></div>
            </div>
          </div>

          <div className="p-4 bg-red-ribbon/5 border border-red-ribbon/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Insulin Syringes</p>
              <span className="text-xs bg-red-ribbon text-white px-2 py-1 rounded">Critical</span>
            </div>
            <p className="text-xs text-muted-foreground">8 units remaining</p>
            <div className="mt-2 w-full bg-muted h-1.5 rounded-full">
              <div className="bg-red-ribbon h-1.5 rounded-full" style={{ width: '5%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-tory-blue text-tory-blue rounded-lg hover:bg-tory-blue hover:text-white transition-colors text-center">
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Open Patient File</p>
          </button>
          <button className="p-4 border border-tory-blue text-tory-blue rounded-lg hover:bg-tory-blue hover:text-white transition-colors text-center">
            <Pill className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Create Prescription</p>
          </button>
          <button className="p-4 border border-tory-blue text-tory-blue rounded-lg hover:bg-tory-blue hover:text-white transition-colors text-center">
            <TestTube className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Request Lab Order</p>
          </button>
          <button className="p-4 border border-tory-blue text-tory-blue rounded-lg hover:bg-tory-blue hover:text-white transition-colors text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">View Full Schedule</p>
          </button>
        </div>
      </div>
    </div>
  );
}
