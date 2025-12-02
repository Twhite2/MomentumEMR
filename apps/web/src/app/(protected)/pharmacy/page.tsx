'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Button, Input } from '@momentum/ui';
import { Pill, Search, Package, AlertTriangle, TrendingUp, Calendar, User } from 'lucide-react';
import Link from 'next/link';

export default function PharmacyPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch recent prescriptions
  const { data: prescriptionsData } = useQuery({
    queryKey: ['pharmacy-prescriptions'],
    queryFn: async () => {
      const response = await axios.get('/api/prescriptions?limit=10');
      return response.data;
    },
  });

  // Filter prescriptions based on search term
  const filteredPrescriptions = prescriptionsData?.prescriptions?.filter((prescription: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const patientName = `${prescription.patient.firstName} ${prescription.patient.lastName}`.toLowerCase();
    const doctorName = prescription.doctor.name.toLowerCase();
    const medications = prescription.prescriptionItems.map((item: any) => item.drugName.toLowerCase()).join(' ');
    
    return patientName.includes(search) || doctorName.includes(search) || medications.includes(search);
  }) || [];

  // Calculate stats from prescriptions
  const allPrescriptions = prescriptionsData?.prescriptions || [];
  const pendingCount = allPrescriptions.filter((p: any) => p.status === 'active').length;
  const completedToday = allPrescriptions.filter((p: any) => {
    const today = new Date().toDateString();
    const prescriptionDate = new Date(p.createdAt).toDateString();
    return prescriptionDate === today && p.status === 'completed';
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Pill className="w-8 h-8" />
            Pharmacy
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage prescriptions and medication dispensing
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Prescriptions</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {pendingCount}
              </p>
            </div>
            <Package className="w-10 h-10 text-orange-600/20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dispensed Today</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {completedToday}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600/20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600 mt-1">-</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600/20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Prescriptions</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {prescriptionsData?.total || 0}
              </p>
            </div>
            <Pill className="w-10 h-10 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search prescriptions by patient name, ID, or medication..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/prescriptions">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Pill className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">View Prescriptions</h3>
                <p className="text-sm text-muted-foreground">Manage all prescriptions</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/inventory">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-600/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Inventory</h3>
                <p className="text-sm text-muted-foreground">Check stock levels</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/invoices">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Billing</h3>
                <p className="text-sm text-muted-foreground">View invoices & payments</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-primary">Recent Prescriptions</h2>
        </div>
        <div className="p-6">
          {filteredPrescriptions.length > 0 ? (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription: any) => (
                <Link key={prescription.id} href={`/prescriptions/${prescription.id}`}>
                  <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold text-primary">
                            {prescription.patient.firstName} {prescription.patient.lastName}
                          </h3>
                          {prescription.patient.admissions && prescription.patient.admissions.length > 0 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-ribbon/10 text-red-ribbon">
                              ADMITTED
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            prescription.status === 'active' 
                              ? 'bg-green-haze/10 text-green-haze' 
                              : prescription.status === 'completed'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-amaranth/10 text-amaranth'
                          }`}>
                            {prescription.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Prescribed by Dr. {prescription.doctor.name}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground">
                            <strong>{prescription.prescriptionItems.length} medication(s)</strong>
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {prescription.prescriptionItems.map((item: any) => item.drugName).join(', ')}
                          </span>
                        </div>
                        {prescription.treatmentPlan && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Notes:</strong> {prescription.treatmentPlan}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(prescription.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Pill className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>
                {searchTerm 
                  ? `No prescriptions found matching "${searchTerm}"`
                  : 'No recent prescriptions to display'
                }
              </p>
              <p className="text-sm mt-2">
                Prescriptions will appear here as they are created
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

