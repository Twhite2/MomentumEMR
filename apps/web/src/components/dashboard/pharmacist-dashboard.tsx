'use client';

import { StatCard } from './stat-card';
import { Pill, AlertTriangle, ShoppingCart, Package, TrendingUp, Calendar, Clock, CheckCircle, User, ArrowRight } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@momentum/ui';

interface PharmacistDashboardProps {
  session: Session;
}

export default function PharmacistDashboard({ session }: PharmacistDashboardProps) {
  // Fetch prescriptions data
  const { data: prescriptionsData, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['pharmacist-prescriptions'],
    queryFn: async () => {
      const response = await axios.get('/api/prescriptions?limit=100');
      return response.data;
    },
  });

  // Fetch inventory data
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['pharmacist-inventory'],
    queryFn: async () => {
      const response = await axios.get('/api/inventory?limit=100');
      return response.data;
    },
  });

  // Calculate stats
  const allPrescriptions = prescriptionsData?.prescriptions || [];
  const allInventory = inventoryData?.items || [];

  const pendingCount = allPrescriptions.filter((p: any) => p.status === 'active').length;
  const completedToday = allPrescriptions.filter((p: any) => {
    const today = new Date().toDateString();
    const prescriptionDate = new Date(p.createdAt).toDateString();
    return prescriptionDate === today && p.status === 'completed';
  }).length;
  
  const lowStockItems = allInventory.filter((item: any) => 
    item.quantity <= (item.reorderLevel || 50)
  );
  const stockAlerts = lowStockItems.length;

  const outOfStockItems = allInventory.filter((item: any) => item.quantity === 0).length;

  // Get recent active prescriptions for queue
  const recentPrescriptions = allPrescriptions
    .filter((p: any) => p.status === 'active')
    .slice(0, 5);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLoading = prescriptionsLoading || inventoryLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground mt-1">Pharmacist Dashboard</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link href="/prescriptions">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-orange-500 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Prescriptions</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {isLoading ? '...' : pendingCount}
                </p>
              </div>
              <Package className="w-10 h-10 text-orange-600/20" />
            </div>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dispensed Today</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {isLoading ? '...' : completedToday}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600/20" />
          </div>
        </div>

        <Link href="/inventory">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-red-500 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {isLoading ? '...' : stockAlerts}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600/20" />
            </div>
          </div>
        </Link>

        <Link href="/pharmacy">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Prescriptions</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {isLoading ? '...' : prescriptionsData?.total || 0}
                </p>
              </div>
              <Pill className="w-10 h-10 text-primary/20" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prescription Queue */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Prescription Queue
            </h2>
            <Link href="/prescriptions">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : recentPrescriptions.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">No pending prescriptions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPrescriptions.map((prescription: any) => (
                <Link key={prescription.id} href={`/prescriptions/${prescription.id}`}>
                  <div className="p-3 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          RX-{prescription.id.toString().padStart(6, '0')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {prescription.patient.firstName} {prescription.patient.lastName}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {prescription.prescriptionItems?.length || 0} medication(s)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(prescription.createdAt)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Critical Stock Alerts */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Critical Stock Alerts
            </h2>
            <Link href="/inventory">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">All stock levels are healthy</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {lowStockItems.slice(0, 10).map((item: any) => (
                <Link key={item.id} href="/inventory">
                  <div className={`p-3 rounded-lg border cursor-pointer hover:border-primary transition-colors ${
                    item.quantity === 0 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.quantity === 0 ? (
                            <span className="text-red-600 font-semibold">OUT OF STOCK</span>
                          ) : (
                            <>
                              <span className="text-orange-600 font-semibold">{item.quantity} units</span>
                              {' - Reorder at ' + (item.reorderLevel || 50)}
                            </>
                          )}
                        </p>
                        {item.supplier && (
                          <p className="text-xs text-muted-foreground">
                            Supplier: {item.supplier}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/pharmacy">
            <Button variant="outline" className="w-full justify-start">
              <Pill className="w-4 h-4 mr-2" />
              View All Prescriptions
            </Button>
          </Link>
          <Link href="/inventory">
            <Button variant="outline" className="w-full justify-start">
              <Package className="w-4 h-4 mr-2" />
              Manage Inventory
            </Button>
          </Link>
          <Link href="/invoices">
            <Button variant="outline" className="w-full justify-start">
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Invoices
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

