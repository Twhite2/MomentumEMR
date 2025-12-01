'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Building2, Plus, MapPin, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Hospital {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  contactEmail: string;
  subscriptionPlan: string;
  active: boolean;
  createdAt: string;
}

export default function HospitalsPage() {
  const { data: hospitals, isLoading } = useQuery<Hospital[]>({
    queryKey: ['hospitals'],
    queryFn: async () => {
      const response = await axios.get('/api/hospitals');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading hospitals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Hospital Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage hospital accounts and subscriptions
          </p>
        </div>
        <Link href="/hospitals/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Hospital
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hospitals</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {hospitals?.length || 0}
              </p>
            </div>
            <Building2 className="w-10 h-10 text-primary/20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {hospitals?.filter((h) => h.active).length || 0}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600/20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {hospitals?.filter((h) => !h.active).length || 0}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-red-600/20" />
          </div>
        </div>
      </div>

      {/* Hospitals List */}
      <div className="bg-white rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-sm">Hospital Name</th>
                <th className="text-left p-4 font-semibold text-sm">Subdomain</th>
                <th className="text-left p-4 font-semibold text-sm">Contact</th>
                <th className="text-left p-4 font-semibold text-sm">Location</th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals?.map((hospital) => (
                <tr
                  key={hospital.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{hospital.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {hospital.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <a 
                      href={`https://${(hospital as any).subdomain}.momentumhealthcare.io`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-primary hover:underline"
                    >
                      {(hospital as any).subdomain}.momentumhealthcare.io
                    </a>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {hospital.contactEmail}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {hospital.phoneNumber}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-xs">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{hospital.address}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {hospital.subscriptionPlan}
                    </span>
                  </td>
                  <td className="p-4">
                    {hospital.active ? (
                      <span className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-red-600 text-sm">
                        <XCircle className="w-4 h-4" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <Link href={`/hospitals/${hospital.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

