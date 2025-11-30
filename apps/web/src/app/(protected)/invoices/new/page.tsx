'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { ArrowLeft, Save, Plus, Trash2, Receipt, Search, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  patientType: string;
  hmoId?: number;
  hmo?: { id: number; name: string };
}

interface HmoTariff {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
  isPARequired: boolean;
}

interface InventoryItem {
  id: number;
  itemName: string;
  category: string;
  unitPrice: number;
  hmoPrice?: number;
  corporatePrice?: number;
  stockQuantity: number;
}

interface InvoiceItem {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: number;
  sourceType?: 'tariff' | 'inventory' | 'manual';
  sourceId?: number;
  isManualOverride?: boolean;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');
  const appointmentId = searchParams.get('appointmentId');

  const [patientId, setPatientId] = useState(preSelectedPatientId || '');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: '1', unitPrice: '', amount: 0, sourceType: 'manual', isManualOverride: false },
  ]);

  // Fetch patients
  const { data: patients } = useQuery<{ patients: Patient[] }>({
    queryKey: ['patients-all'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=100');
      return response.data;
    },
  });

  // Fetch selected patient details
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await axios.get(`/api/patients/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
  });

  // Fetch HMO tariffs or inventory based on patient type
  const { data: pricingData, isLoading: pricingLoading } = useQuery({
    queryKey: ['pricing', patient?.patientType, patient?.hmoId, searchTerm],
    queryFn: async () => {
      if (patient?.patientType === 'hmo' && patient?.hmoId) {
        const response = await axios.get(`/api/hmo-tariffs?patientId=${patientId}&search=${searchTerm}`);
        return { type: 'tariff' as const, items: response.data.tariffs, hmo: response.data.hmo };
      } else {
        const response = await axios.get(`/api/inventory/pricing?search=${searchTerm}`);
        return { type: 'inventory' as const, items: response.data.inventory };
      }
    },
    enabled: !!patient,
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

  // Helper function to get price based on patient type
  const getPrice = (item: any, patientType: string): number => {
    if (pricingData?.type === 'tariff') {
      return item.basePrice || 0;
    } else {
      // Inventory item
      if (patientType === 'hmo') return item.hmoPrice || item.unitPrice || 0;
      if (patientType === 'corporate') return item.corporatePrice || item.unitPrice || 0;
      return item.unitPrice || 0;
    }
  };

  // Handle item selection from dropdown
  const handleItemSelect = (index: number, selectedId: string) => {
    if (!selectedId || !pricingData) return;

    const selectedItem = pricingData.items.find((i: any) => i.id === parseInt(selectedId));
    if (!selectedItem) return;

    const price = getPrice(selectedItem, patient?.patientType || 'self_pay');
    const description = pricingData.type === 'tariff' 
      ? `${selectedItem.name} (${selectedItem.code})`
      : selectedItem.itemName;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      description,
      unitPrice: price.toString(),
      sourceType: pricingData.type === 'tariff' ? 'tariff' : 'inventory',
      sourceId: selectedItem.id,
      isManualOverride: false,
    };

    // Recalculate amount
    const qty = parseFloat(updated[index].quantity) || 0;
    updated[index].amount = qty * price;

    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: '1', unitPrice: '', amount: 0, sourceType: 'manual', isManualOverride: false }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | boolean) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Mark as manual override if price is changed manually
    if (field === 'unitPrice' && (updated[index].sourceType === 'tariff' || updated[index].sourceType === 'inventory')) {
      updated[index].isManualOverride = true;
    }

    // Calculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(updated[index].quantity) || 0;
      const price = parseFloat(updated[index].unitPrice as string) || 0;
      updated[index].amount = qty * price;
    }

    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal(); // No VAT
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

            {/* Patient Type Badge */}
            {patient && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Patient Type:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  patient.patientType === 'hmo' ? 'bg-tory-blue/10 text-tory-blue' :
                  patient.patientType === 'corporate' ? 'bg-danube/10 text-danube' :
                  'bg-green-haze/10 text-green-haze'
                }`}>
                  {patient.patientType === 'hmo' && patient.hmo ? `HMO: ${patient.hmo.name}` :
                   patient.patientType === 'corporate' ? 'Corporate' :
                   'Self-Pay'}
                </span>
                {patient.patientType === 'hmo' && (
                  <span className="text-xs text-muted-foreground">(Prices from HMO Tariff)</span>
                )}
                {patient.patientType !== 'hmo' && (
                  <span className="text-xs text-muted-foreground">(Prices from Inventory)</span>
                )}
              </div>
            )}
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

                  {/* Smart Item Selector */}
                  {patient && pricingData && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select from {pricingData.type === 'tariff' ? 'HMO Tariff' : 'Inventory'}
                      </label>
                      <Select
                        value=""
                        onChange={(e) => handleItemSelect(index, e.target.value)}
                        className="w-full"
                      >
                        <option value="">-- Select item to auto-populate --</option>
                        {pricingData.items.map((pItem: any) => (
                          <option key={pItem.id} value={pItem.id}>
                            {pricingData.type === 'tariff' 
                              ? `${pItem.name} (${pItem.code}) - ${formatCurrency(pItem.basePrice)}`
                              : `${pItem.itemName} (${pItem.category}) - ${formatCurrency(getPrice(pItem, patient.patientType))}`
                            }
                          </option>
                        ))}
                      </Select>
                      {pricingData.items.length === 0 && (
                        <p className="text-sm text-saffron mt-1">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          No {pricingData.type === 'tariff' ? 'HMO tariffs' : 'inventory items'} available
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Description"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, 'description', e.target.value)
                        }
                        placeholder="Or enter manually..."
                        required
                      />
                      {/* Price Source Badge */}
                      {item.sourceType !== 'manual' && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            item.sourceType === 'tariff' ? 'bg-tory-blue/10 text-tory-blue' : 'bg-green-haze/10 text-green-haze'
                          }`}>
                            {item.sourceType === 'tariff' ? 'HMO Tariff' : 'Inventory'}
                          </span>
                          {item.isManualOverride && (
                            <span className="text-xs px-2 py-0.5 rounded bg-saffron/10 text-saffron">
                              Manual Override
                            </span>
                          )}
                        </div>
                      )}
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

                    <div>
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
                      {item.sourceType !== 'manual' && !item.isManualOverride && (
                        <p className="text-xs text-muted-foreground mt-1">Auto-populated price</p>
                      )}
                    </div>
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
