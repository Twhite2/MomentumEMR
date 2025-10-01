'use client';

import { StatCard } from './stat-card';
import { TestTube, CheckCircle, Upload } from 'lucide-react';
import { Session } from 'next-auth';

interface LabTechDashboardProps {
  session: Session;
}

export default function LabTechDashboard({ session }: LabTechDashboardProps) {
  const stats = {
    pendingOrders: 7,
    completedToday: 15,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground mt-1">Lab Technician Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Pending Lab Orders" value={stats.pendingOrders} icon={TestTube} color="yellow" />
        <StatCard title="Completed Today" value={stats.completedToday} icon={CheckCircle} color="green" />
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Lab Orders Queue</h2>
        <div className="space-y-3">
          <div className="p-3 border border-red-ribbon/20 bg-red-ribbon/5 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">Blood Work - John Doe</p>
                <p className="text-xs text-muted-foreground mt-1">Order #LAB-2025-045</p>
                <p className="text-xs text-muted-foreground">Ordered: 2 hours ago</p>
              </div>
              <span className="text-xs bg-red-ribbon text-white px-2 py-1 rounded">Urgent</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="text-xs bg-saffron text-black px-3 py-1.5 rounded hover:bg-saffron/90">
                Mark In Progress
              </button>
              <button className="text-xs border border-border px-3 py-1.5 rounded hover:bg-muted">
                View Details
              </button>
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">X-Ray - Mary Smith</p>
                <p className="text-xs text-muted-foreground mt-1">Order #LAB-2025-046</p>
                <p className="text-xs text-muted-foreground">Ordered: 4 hours ago</p>
              </div>
              <span className="text-xs bg-spindle text-tory-blue px-2 py-1 rounded">Pending</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="text-xs bg-tory-blue text-white px-3 py-1.5 rounded hover:bg-tory-blue/90">
                Start Test
              </button>
            </div>
          </div>

          <div className="p-3 border rounded-lg bg-green-haze/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">CT Scan - Ahmed Ibrahim</p>
                <p className="text-xs text-muted-foreground mt-1">Order #LAB-2025-044</p>
                <p className="text-xs text-muted-foreground">Completed: 1 hour ago</p>
              </div>
              <span className="text-xs bg-green-haze text-white px-2 py-1 rounded">Ready to Upload</span>
            </div>
            <div className="mt-3">
              <button className="text-xs bg-tory-blue text-white px-3 py-1.5 rounded hover:bg-tory-blue/90 flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Upload Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
