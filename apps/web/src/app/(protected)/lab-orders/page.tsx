'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Select } from '@momentum/ui';
import { Plus, TestTube, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface LabOrder {
  id: number;
  orderType: string;
  status: string;
  description: string | null;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
  };
  doctor: {
    id: number;
    name: string;
  };
  labResults: Array<{
    id: number;
    finalized: boolean;
    createdAt: string;
  }>;
  createdAt: string;
}

interface LabOrdersResponse {
  orders: LabOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function LabOrdersPage() {
  const { data: session } = useSession();
  const isLabTech = session?.user?.role === 'lab_tech';
  // Doctors, admin, and receptionist can create lab orders
  const canCreateLabOrder = ['admin', 'doctor', 'receptionist'].includes(session?.user?.role || '');
  
  const [status, setStatus] = useState('');
  const [orderType, setOrderType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<LabOrdersResponse>({
    queryKey: ['lab-orders', status, orderType, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (status) params.append('status', status);
      if (orderType) params.append('orderType', orderType);

      const response = await axios.get(`/api/lab-orders?${params}`);
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-saffron/10 text-saffron';
      case 'in_progress':
        return 'bg-primary/10 text-primary';
      case 'completed':
        return 'bg-green-haze/10 text-green-haze';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getOrderTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Lab_Test: 'bg-green-haze/10 text-green-haze',
      X_ray: 'bg-primary/10 text-primary',
      CT_Scan: 'bg-danube/10 text-danube',
      MRI: 'bg-amaranth/10 text-amaranth',
      Ultrasound: 'bg-saffron/10 text-saffron',
      Pathology: 'bg-froly/10 text-froly',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isLabTech ? 'Incoming Lab Orders' : 'Lab Orders'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLabTech 
              ? 'View and process diagnostic test requests from doctors'
              : 'Manage diagnostic tests and laboratory orders'}
          </p>
        </div>
        {canCreateLabOrder && (
          <Link href="/lab-orders/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              New Lab Order
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
            <option value="">All Types</option>
            <option value="Lab_Test">Lab Test</option>
            <option value="X_ray">X-Ray</option>
            <option value="CT_Scan">CT Scan</option>
            <option value="MRI">MRI</option>
            <option value="Ultrasound">Ultrasound</option>
            <option value="Pathology">Pathology</option>
          </Select>

          {(status || orderType) && (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setStatus('');
                setOrderType('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Lab Orders List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading lab orders...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load lab orders</p>
          </div>
        ) : data?.orders.length === 0 ? (
          <div className="p-8 text-center">
            <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No lab orders found
            </p>
            {canCreateLabOrder && (
              <Link href="/lab-orders/new">
                <Button variant="primary" size="sm" className="mt-4">
                  Create First Lab Order
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.orders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/lab-orders/${order.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <TestTube className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {order.patient.firstName} {order.patient.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Ordered by Dr. {order.doctor.name}
                          </p>
                        </div>
                      </div>

                      <div className="ml-15 space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getOrderTypeColor(
                              order.orderType
                            )}`}
                          >
                            {order.orderType.replace('_', ' ')}
                          </span>
                          {order.labResults.length > 0 && (
                            <span className="text-xs text-green-haze">
                              • {order.labResults.length} result(s) uploaded
                            </span>
                          )}
                        </div>

                        {order.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {order.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Ordered: {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <Link
                        href={`/patients/${order.patient.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="sm">
                          <User className="w-4 h-4 mr-2" />
                          View Patient
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to{' '}
                  {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} lab
                  orders
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

