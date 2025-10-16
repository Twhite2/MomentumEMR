'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import { DollarSign, Search, FileText, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Billing & Invoices
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage invoices, payments, and financial records
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-primary mt-1">₦2.4M</p>
              <p className="text-xs text-green-600 mt-1">+12% from last month</p>
            </div>
            <TrendingUp className="w-10 h-10 text-primary/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Invoices</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">18</p>
              <p className="text-xs text-muted-foreground mt-1">₦450,000</p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-600/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paid Today</p>
              <p className="text-2xl font-bold text-green-600 mt-1">32</p>
              <p className="text-xs text-muted-foreground mt-1">₦145,000</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">5</p>
              <p className="text-xs text-muted-foreground mt-1">₦85,000</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-600/20" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg border border-border">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by patient name, invoice number, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select className="px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue">
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
          <select className="px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue">
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/invoices">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">All Invoices</h3>
                <p className="text-sm text-muted-foreground">View & manage all invoices</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/invoices?status=pending">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-orange-600 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-600/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Pending Payments</h3>
                <p className="text-sm text-muted-foreground">Track unpaid invoices</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/analytics">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-green-600 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Revenue Reports</h3>
                <p className="text-sm text-muted-foreground">View financial analytics</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Recent Invoices</h2>
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
        <div className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No invoices to display</p>
            <p className="text-sm mt-2">
              Invoices will appear here as they are created
            </p>
            <Link href="/invoices/new">
              <Button className="mt-4">Create Your First Invoice</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

