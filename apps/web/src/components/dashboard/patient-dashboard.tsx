'use client';

import { StatCard } from './stat-card';
import { Calendar, FileText, DollarSign, TestTube } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface PatientDashboardProps {
  session: Session;
}

export default function PatientDashboard({ session }: PatientDashboardProps) {
  const router = useRouter();

  // Fetch patient's lab results
  const { data: labResultsData } = useQuery({
    queryKey: ['patient-lab-results'],
    queryFn: async () => {
      const response = await axios.get('/api/lab-results/patient');
      return response.data;
    },
  });

  const recentResults = labResultsData?.results?.slice(0, 2) || [];
  const recentResultsCount = labResultsData?.stats?.recentResults || 0;

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
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No upcoming appointments</p>
            <Link href="/appointments">
              <button className="text-sm bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 mt-4">
                Schedule Appointment
              </button>
            </Link>
          </div>
        </div>

        {/* Recent Lab Results */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Lab Results</h2>
            <TestTube className="w-5 h-5 text-green-haze" />
          </div>
          {recentResults.length > 0 ? (
            <div className="space-y-3">
              {recentResults.map((result: any) => (
                <Link key={result.id} href={`/lab-results#result-${result.id}`}>
                  <div className="p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <p className="font-medium text-sm">{result.labOrder.orderType.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Released: {new Date(result.releasedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-primary hover:underline mt-2">
                      View Details →
                    </p>
                  </div>
                </Link>
              ))}
              {recentResultsCount > 2 && (
                <Link href="/lab-results" className="block text-center text-sm text-primary hover:underline pt-2">
                  View all {recentResultsCount} results →
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TestTube className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No lab results available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Billing Summary */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Billing Summary</h2>
          <DollarSign className="w-5 h-5 text-saffron" />
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Billing information will be available soon</p>
          <p className="text-xs mt-2">Contact reception for billing inquiries</p>
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

