'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select } from '@momentum/ui';
import { ArrowLeft, Receipt, User, DollarSign, CreditCard, Calendar } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

interface Invoice {
  id: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  notes: string | null;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    patientType: string;
  };
  appointment: {
    id: number;
    appointmentType: string;
    doctor: {
      id: number;
      name: string;
    };
  } | null;
  invoiceItems: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  payments: Array<{
    id: number;
    amount: number;
    paymentMethod: string;
    reference: string | null;
    paymentDate: string;
    processedBy: {
      id: number;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const invoiceId = params.id as string;

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    reference: '',
  });

  const { data: invoice, isLoading, error } = useQuery<Invoice>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await axios.get(`/api/invoices/${invoiceId}`);
      return response.data;
    },
  });

  // Record payment mutation
  const recordPayment = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`/api/invoices/${invoiceId}/payments`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      setShowPaymentForm(false);
      setPaymentData({ amount: '', paymentMethod: 'Cash', reference: '' });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    },
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPayment.mutate(paymentData);
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-haze text-white';
      case 'partial':
        return 'bg-saffron text-black';
      case 'pending':
        return 'bg-red-ribbon text-white';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-tory-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-ribbon mb-4">Failed to load invoice</p>
          <Link href="/invoices">
            <Button variant="outline">Back to Invoices</Button>
          </Link>
        </div>
      </div>
    );
  }

  const balance = invoice.totalAmount - invoice.paidAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Invoice</h1>
            <p className="text-muted-foreground mt-1">
              INV-{invoice.id.toString().padStart(6, '0')}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(invoice.status)}`}>
          {invoice.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Items */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-haze" />
              Invoice Items ({invoice.invoiceItems.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="text-center py-2 px-2 text-sm font-medium text-muted-foreground">
                      Qty
                    </th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">
                      Unit Price
                    </th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoiceItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 px-2">{item.description}</td>
                      <td className="py-3 px-2 text-center">{item.quantity}</td>
                      <td className="py-3 px-2 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-6 border-t flex justify-end">
              <div className="w-full md:w-1/2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.totalAmount / 1.075)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (7.5%):</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.totalAmount - invoice.totalAmount / 1.075)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-green-haze">
                  <span className="font-medium">Paid:</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.paidAmount)}
                  </span>
                </div>
                {balance > 0 && (
                  <div className="flex justify-between text-red-ribbon">
                    <span className="font-medium">Balance:</span>
                    <span className="font-bold">{formatCurrency(balance)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Payment History ({invoice.payments.length})</h2>
              {balance > 0 && !showPaymentForm && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowPaymentForm(true)}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </div>

            {/* Payment Form */}
            {showPaymentForm && (
              <form
                onSubmit={handlePaymentSubmit}
                className="mb-6 p-4 border border-green-haze/20 bg-green-haze/5 rounded-lg"
              >
                <h3 className="font-semibold mb-4">Record New Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Amount (₦)"
                    type="number"
                    min="0.01"
                    max={balance}
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amount: e.target.value })
                    }
                    placeholder={`Max: ${formatCurrency(balance)}`}
                    required
                  />
                  <Select
                    label="Payment Method"
                    value={paymentData.paymentMethod}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, paymentMethod: e.target.value })
                    }
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Transfer">Bank Transfer</option>
                    <option value="Mobile_Money">Mobile Money</option>
                    <option value="Cheque">Cheque</option>
                  </Select>
                  <div className="md:col-span-2">
                    <Input
                      label="Reference/Transaction ID (Optional)"
                      value={paymentData.reference}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, reference: e.target.value })
                      }
                      placeholder="Enter transaction reference"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={recordPayment.isPending}
                  >
                    Record Payment
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Payments List */}
            {invoice.payments.length > 0 ? (
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4 text-green-haze" />
                          <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                          <span className="text-xs px-2 py-1 bg-green-haze/10 text-green-haze rounded">
                            {payment.paymentMethod}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Processed by {payment.processedBy.name}
                        </p>
                        {payment.reference && (
                          <p className="text-sm text-muted-foreground">
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {formatDateTime(payment.paymentDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No payments recorded</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-3">Notes</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Patient</h2>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-16 h-16 bg-tory-blue/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-tory-blue">
                  {invoice.patient.firstName.charAt(0)}
                  {invoice.patient.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {invoice.patient.firstName} {invoice.patient.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {calculateAge(invoice.patient.dob)} years • {invoice.patient.gender}
                </p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {invoice.patient.patientType.replace('_', ' ')}
                </p>
              </div>
            </div>
            <Link href={`/patients/${invoice.patient.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <User className="w-4 h-4 mr-2" />
                View Patient Profile
              </Button>
            </Link>
          </div>

          {/* Appointment Info */}
          {invoice.appointment && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-3">Related Appointment</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium">
                    {invoice.appointment.appointmentType.replace('_', ' ')}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Doctor: </span>
                  <span className="font-medium">Dr. {invoice.appointment.doctor.name}</span>
                </p>
              </div>
              <Link href={`/appointments/${invoice.appointment.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  View Appointment
                </Button>
              </Link>
            </div>
          )}

          {/* Invoice Details */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDateTime(invoice.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDateTime(invoice.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
