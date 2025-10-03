'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Select } from '@momentum/ui';
import { Plus, Receipt, User, DollarSign } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Invoice {
  id: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    patientType: string;
  };
  invoiceItems: Array<{
    id: number;
    description: string;
    amount: number;
  }>;
  payments: Array<{
    id: number;
    amount: number;
  }>;
  createdAt: string;
}

interface InvoicesResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function InvoicesPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<InvoicesResponse>({
    queryKey: ['invoices', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (status) params.append('status', status);

      try {
        const response = await axios.get(`/api/invoices?${params}`);
        return response.data;
      } catch (err: any) {
        const errorDetails = {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
        };
        console.error('Invoice fetch error details:', errorDetails);
        throw new Error(err.response?.data?.error || err.message);
      }
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-haze text-white';
      case 'partial':
        return 'bg-saffron text-black';
      case 'pending':
        return 'bg-red-ribbon/10 text-red-ribbon';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPatientTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      self_pay: 'bg-tory-blue/10 text-tory-blue',
      hmo: 'bg-green-haze/10 text-green-haze',
      corporate: 'bg-amaranth/10 text-amaranth',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
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
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage billing and payment records
          </p>
        </div>
        <Link href="/invoices/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          {status && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setStatus('')}
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-tory-blue border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading invoices...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon font-semibold">Failed to load invoices</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Check browser console for details</p>
          </div>
        ) : data?.invoices.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No invoices found</p>
            <Link href="/invoices/new">
              <Button variant="primary" size="sm" className="mt-4">
                Create First Invoice
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.invoices.map((invoice) => {
                const balance = invoice.totalAmount - invoice.paidAmount;
                return (
                  <div
                    key={invoice.id}
                    className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => (window.location.href = `/invoices/${invoice.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-green-haze/10 rounded-full flex items-center justify-center">
                            <Receipt className="w-6 h-6 text-green-haze" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              Invoice #{invoice.id.toString().padStart(6, '0')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {invoice.patient.firstName} {invoice.patient.lastName}
                            </p>
                          </div>
                        </div>

                        <div className="ml-15 space-y-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getPatientTypeBadge(
                                invoice.patient.patientType
                              )}`}
                            >
                              {invoice.patient.patientType.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {invoice.invoiceItems.length} item(s)
                            </span>
                            {invoice.payments.length > 0 && (
                              <span className="text-xs text-green-haze">
                                • {invoice.payments.length} payment(s)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total: </span>
                              <span className="font-semibold">
                                {formatCurrency(invoice.totalAmount)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Paid: </span>
                              <span className="font-semibold text-green-haze">
                                {formatCurrency(invoice.paidAmount)}
                              </span>
                            </div>
                            {balance > 0 && (
                              <div>
                                <span className="text-muted-foreground">Balance: </span>
                                <span className="font-semibold text-red-ribbon">
                                  {formatCurrency(balance)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground">
                            Created: {formatDate(invoice.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.toUpperCase()}
                        </span>
                        <Link
                          href={`/patients/${invoice.patient.id}`}
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
                );
              })}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to{' '}
                  {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}{' '}
                  invoices
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
