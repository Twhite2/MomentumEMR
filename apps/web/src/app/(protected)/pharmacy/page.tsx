'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import { Pill, Search, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function PharmacyPage() {
  const [searchTerm, setSearchTerm] = useState('');

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
              <p className="text-2xl font-bold text-orange-600 mt-1">12</p>
            </div>
            <Package className="w-10 h-10 text-orange-600/20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dispensed Today</p>
              <p className="text-2xl font-bold text-green-600 mt-1">48</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600/20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600 mt-1">8</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600/20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-primary mt-1">₦245K</p>
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-primary">Recent Prescriptions</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <Pill className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No recent prescriptions to display</p>
            <p className="text-sm mt-2">
              Prescriptions will appear here as they are created
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

