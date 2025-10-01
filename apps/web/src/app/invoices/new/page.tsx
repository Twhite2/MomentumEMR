'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { ArrowLeft, Save, Plus, Trash2, Receipt } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface InvoiceItem {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');
  const appointmentId = searchParams.get('appointmentId');

  const [patientId, setPatientId] = useState(preSelectedPatientId || '');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: '1', unitPrice: '', amount: 0 },
  ]);

  // Fetch patients
  const { data: patients } = useQuery<{ patients: Patient[] }>({
    queryKey: ['patients-all'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=100');
      return response.data;
    },
  });

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/invoices', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Invoice created successfully!');
      router.push(`/invoices/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    },
  });

  const addItem = () => {
    setItems([...items, { description: '', quantity: '1', unitPrice: '', amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Calculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(updated[index].quantity) || 0;
      const price = parseFloat(updated[index].unitPrice) || 0;
      updated[index].amount = qty * price;
    }

    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.075; // 7.5% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter(
      (item) => item.description.trim() !== '' && item.amount > 0
    );

    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    const payload = {
      patientId,
      appointmentId: appointmentId || null,
      notes: notes || null,
      items: validItems,
    };

    createInvoice.mutate(payload);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Invoice</h1>
          <p className="text-muted-foreground mt-1">Create billing invoice for patient</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Patient Selection */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
            <Select
              label="Patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              disabled={!!preSelectedPatientId}
            >
              <option value="">Select patient</option>
              {patients?.patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} (ID: P-
                  {patient.id.toString().padStart(6, '0')})
                </option>
              ))}
            </Select>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Invoice Items</h2>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-border rounded-lg relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-green-haze" />
                      <h3 className="font-medium">Item #{index + 1}</h3>
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-ribbon" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Description"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, 'description', e.target.value)
                        }
                        placeholder="e.g., Consultation fee"
                        required
                      />
                    </div>

                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      required
                    />

                    <Input
                      label="Unit Price (₦)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="mt-3 text-right">
                    <span className="text-sm text-muted-foreground">Amount: </span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex justify-end">
                <div className="w-full md:w-1/2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT (7.5%):</span>
                    <span className="font-medium">{formatCurrency(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold text-lg">Total:</span>
                    <span className="font-bold text-lg text-green-haze">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
            <Textarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Payment terms, additional information..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/invoices">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              loading={createInvoice.isPending}
              disabled={createInvoice.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
