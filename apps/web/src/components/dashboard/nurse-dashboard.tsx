'use client';

import { StatCard } from './stat-card';
import { Bed, Activity, ClipboardCheck, Users } from 'lucide-react';
import { Session } from 'next-auth';

interface NurseDashboardProps {
  session: Session;
}

export default function NurseDashboard({ session }: NurseDashboardProps) {
  const stats = {
    patientsInWard: 24,
    bedOccupancy: 85,
    outstandingTasks: 12,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground mt-1">Nurse Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Patients in Ward" value={stats.patientsInWard} icon={Bed} color="blue" />
        <StatCard title="Bed Occupancy" value={`${stats.bedOccupancy}%`} icon={Activity} color="yellow" />
        <StatCard title="Outstanding Tasks" value={stats.outstandingTasks} icon={ClipboardCheck} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Vital Signs Overview</h2>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">John Doe - Bed 12A</p>
              <p className="text-xs text-muted-foreground mt-1">BP: 120/80 • HR: 72 • Temp: 37.2°C</p>
              <p className="text-xs text-green-haze mt-1">Last updated: 30 min ago</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">Mary Smith - Bed 14B</p>
              <p className="text-xs text-muted-foreground mt-1">BP: 135/85 • HR: 85 • Temp: 38.1°C</p>
              <p className="text-xs text-saffron mt-1">Last updated: 2 hours ago</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Tasks</h2>
          <div className="space-y-2">
            <div className="p-3 bg-red-ribbon/5 border border-red-ribbon/20 rounded-lg">
              <p className="text-sm font-medium">Wound Care - Room 12A</p>
              <p className="text-xs text-muted-foreground">Due: 10:00 AM</p>
            </div>
            <div className="p-3 bg-saffron/5 border border-saffron/20 rounded-lg">
              <p className="text-sm font-medium">Blood Draw - Room 14B</p>
              <p className="text-xs text-muted-foreground">Due: 11:30 AM</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium">Medication Round - Ward A</p>
              <p className="text-xs text-muted-foreground">Due: 2:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
