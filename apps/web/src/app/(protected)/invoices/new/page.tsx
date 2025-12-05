'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { Save, Plus, Trash2, DollarSign, Search, X, Receipt, AlertCircle } from 'lucide-react';
import { BackButton } from '@/components/shared/BackButton';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  patientType: string;
  hmo?: { 
    id: number; 
    name: string;
    providerCode?: string;
  };
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
  inventoryItemId?: number;
  inventoryPrice?: number;
  hmoTariffId?: number;
  hmoTariffPrice?: number;
  paAuthCode?: string;
  isManualPriceOverride?: boolean;
  isManualHMOOverride?: boolean;
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
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [itemSearchTerms, setItemSearchTerms] = useState<{[key: number]: string}>({});
  const [activeHMOSearchIndex, setActiveHMOSearchIndex] = useState<number | null>(null);
  const [hmoSearchTerms, setHMOSearchTerms] = useState<{[key: number]: string}>({});
  const dropdownRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeSearchIndex !== null) {
        const dropdownEl = dropdownRefs.current[activeSearchIndex];
        if (dropdownEl && !dropdownEl.contains(event.target as Node)) {
          setActiveSearchIndex(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSearchIndex]);

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
      console.log('Patient data:', response.data);
      return response.data;
    },
    enabled: !!patientId,
  });

  // Fetch inventory items for description autocomplete
  const currentSearchTerm = activeSearchIndex !== null ? (itemSearchTerms[activeSearchIndex] || '') : '';
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-pricing', currentSearchTerm],
    queryFn: async () => {
      const response = await axios.get(`/api/inventory/pricing?search=${currentSearchTerm}`);
      console.log('Inventory response:', response.data);
      return response.data.inventory || [];
    },
    enabled: !!patient && currentSearchTerm.length >= 2,
  });

  // Fetch HMO tariffs for HMO coverage autocomplete (HMO patients only)
  const currentHMOSearchTerm = activeHMOSearchIndex !== null ? (hmoSearchTerms[activeHMOSearchIndex] || '') : '';
  const isHMOPatient = patient?.patientType === 'hmo' && patient?.hmo?.id;
  const { data: hmoTariffData, isLoading: hmoTariffLoading } = useQuery({
    queryKey: ['hmo-tariffs', patient?.hmo?.id, currentHMOSearchTerm],
    queryFn: async () => {
      const response = await axios.get(`/api/hmo-tariffs?patientId=${patientId}&search=${currentHMOSearchTerm}`);
      console.log('HMO Tariffs response:', response.data);
      return response.data.tariffs || [];
    },
    enabled: !!patient && isHMOPatient && currentHMOSearchTerm.length >= 2,
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

  // Helper function to get inventory price based on patient type
  const getInventoryPrice = (item: any, patientType: string): number => {
    if (patientType === 'hmo') return item.hmoPrice || item.unitPrice || 0;
    if (patientType === 'corporate') return item.corporatePrice || item.unitPrice || 0;
    return item.unitPrice || 0;
  };

  // Calculate final unit price for HMO patients with PA code
  const calculateFinalPrice = (item: InvoiceItem): number => {
    // For HMO patients with PA authorization code, HMO pays the agreed price
    if (item.paAuthCode && item.hmoTariffPrice) {
      return item.hmoTariffPrice; // HMO pays this amount
    }
    // Otherwise, use inventory price or manual unit price
    return item.inventoryPrice || parseFloat(item.unitPrice) || 0;
  };

  // Handle inventory item selection
  const handleInventorySelect = (index: number, selectedItem: any) => {
    if (!selectedItem) return;

    const price = getInventoryPrice(selectedItem, patient?.patientType || 'self_pay');
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      description: selectedItem.itemName,
      inventoryItemId: selectedItem.id,
      inventoryPrice: price,
      isManualPriceOverride: false,
    };

    // For HMO patients, if no PA code, use inventory price
    // If PA code exists, price will be the HMO tariff price
    const finalPrice = calculateFinalPrice(updated[index]);
    updated[index].unitPrice = finalPrice.toString();

    // Recalculate amount
    const qty = parseFloat(updated[index].quantity) || 0;
    updated[index].amount = qty * finalPrice;

    setItems(updated);
    setActiveSearchIndex(null);
    setItemSearchTerms(prev => ({ ...prev, [index]: '' }));
  };

  // Handle HMO tariff selection
  const handleHMOTariffSelect = (index: number, selectedTariff: any) => {
    if (!selectedTariff) return;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      description: updated[index].description || selectedTariff.name, // Use tariff name if no description
      hmoTariffId: selectedTariff.id,
      hmoTariffPrice: selectedTariff.basePrice,
      isManualHMOOverride: false,
    };

    // For HMO tariff without inventory item, start at 0 (will be filled with agreed price)
    // If there's an inventory item, use inventory price
    // If PA code exists, use HMO tariff price
    let finalPrice = 0;
    if (updated[index].paAuthCode && updated[index].hmoTariffPrice) {
      // With PA code, use HMO agreed price
      finalPrice = updated[index].hmoTariffPrice;
    } else if (updated[index].inventoryItemId && updated[index].inventoryPrice) {
      // With inventory item, use inventory price
      finalPrice = updated[index].inventoryPrice;
    }
    // Otherwise default to 0 - user must enter agreed price
    
    updated[index].unitPrice = finalPrice.toString();

    // Recalculate amount
    const qty = parseFloat(updated[index].quantity) || 0;
    updated[index].amount = qty * finalPrice;

    setItems(updated);
    setActiveHMOSearchIndex(null);
    setHMOSearchTerms(prev => ({ ...prev, [index]: '' }));
  };

  // Handle description input change
  const handleDescriptionChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], description: value };
    setItems(updated);
    setItemSearchTerms(prev => ({ ...prev, [index]: value }));
    setActiveSearchIndex(index);
  };

  // Handle HMO coverage input change
  const handleHMOCoverageChange = (index: number, value: string) => {
    setHMOSearchTerms(prev => ({ ...prev, [index]: value }));
    setActiveHMOSearchIndex(index);
  };

  // Handle manual HMO price override (agreed price with PA)
  const handleManualHMOPriceChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      hmoTariffPrice: parseFloat(value) || 0,
      isManualHMOOverride: true,
    };

    // Recalculate final price
    const finalPrice = calculateFinalPrice(updated[index]);
    updated[index].unitPrice = finalPrice.toString();

    const qty = parseFloat(updated[index].quantity) || 0;
    updated[index].amount = qty * finalPrice;

    setItems(updated);
  };

  // Handle PA authorization code change
  const handlePACodeChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      paAuthCode: value,
    };

    // Recalculate final price with PA code logic
    const finalPrice = calculateFinalPrice(updated[index]);
    updated[index].unitPrice = finalPrice.toString();

    const qty = parseFloat(updated[index].quantity) || 0;
    updated[index].amount = qty * finalPrice;

    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: '1', unitPrice: '', amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | boolean | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Mark as manual override if inventory price is changed manually
    if (field === 'inventoryPrice') {
      updated[index].isManualPriceOverride = true;
      const finalPrice = calculateFinalPrice(updated[index]);
      updated[index].unitPrice = finalPrice.toString();
    }

    // Calculate amount
    if (field === 'quantity') {
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
        <BackButton label={preSelectedPatientId ? "Back to Patient" : "Back to Invoices"} />
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
                  patient.patientType === 'hmo' ? 'bg-primary/10 text-primary' :
                  patient.patientType === 'corporate' ? 'bg-danube/10 text-danube' :
                  'bg-green-haze/10 text-green-haze'
                }`}>
                  {patient.patientType === 'hmo' && patient.hmo ? `HMO: ${patient.hmo.name}` :
                   patient.patientType === 'corporate' ? 'Corporate' :
                   'Self-Pay'}
                </span>
                {patient.patientType === 'hmo' && (
                  <span className="text-xs text-muted-foreground">(Invoice = Inventory Price - HMO Coverage)</span>
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

                  {/* Item Description - Search Inventory */}
                  <div className="space-y-4">
                    <div 
                      className="relative"
                      ref={(el) => { dropdownRefs.current[index] = el; }}
                    >
                      <Input
                        label={isHMOPatient ? "Item Description (Optional)" : "Item Description"}
                        value={item.description}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                        onFocus={() => {
                          if (item.description) {
                            setActiveSearchIndex(index);
                            setItemSearchTerms(prev => ({ ...prev, [index]: item.description }));
                          }
                        }}
                        placeholder={isHMOPatient ? "Optional - Start typing to search inventory..." : "Start typing to search inventory..."}
                        required={!isHMOPatient || !item.hmoTariffId}
                        autoComplete="off"
                      />
                      
                      {/* Inventory Autocomplete Dropdown */}
                      {activeSearchIndex === index && currentSearchTerm.length >= 2 && patient && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {inventoryLoading ? (
                            <div className="p-4 text-center text-muted-foreground">
                              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                              Searching inventory...
                            </div>
                          ) : inventoryData && inventoryData.length > 0 ? (
                            <ul className="py-1">
                              {inventoryData.map((invItem: any) => (
                                <li
                                  key={invItem.id}
                                  onClick={() => handleInventorySelect(index, invItem)}
                                  className="px-4 py-2 hover:bg-primary/10 cursor-pointer transition-colors border-b border-border last:border-b-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{invItem.itemName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {invItem.category} • Stock: {invItem.stockQuantity}
                                      </p>
                                    </div>
                                    <div className="text-right ml-4">
                                      <p className="font-semibold text-green-haze">
                                        {formatCurrency(getInventoryPrice(invItem, patient.patientType))}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Inventory</p>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              <AlertCircle className="w-5 h-5 mx-auto mb-2 text-saffron" />
                              <p className="text-sm">No items found matching &quot;{currentSearchTerm}&quot;</p>
                            </div>
                          )}
                        </div>
                      )}
                      {item.inventoryItemId && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-green-haze/10 text-green-haze">
                            From Inventory
                          </span>
                        </div>
                      )}
                    </div>

                    {/* HMO Coverage Field - Only for HMO Patients */}
                    {isHMOPatient && (
                      <>
                        <div className="relative">
                          <label className="block text-sm font-medium mb-2">
                            HMO Coverage
                          </label>
                          <input
                            type="text"
                            value={hmoSearchTerms[index] || ''}
                            onChange={(e) => handleHMOCoverageChange(index, e.target.value)}
                            onFocus={() => setActiveHMOSearchIndex(index)}
                            placeholder="Search HMO tariff coverage..."
                            className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            autoComplete="off"
                          />
                          
                          {/* HMO Tariff Autocomplete Dropdown */}
                          {activeHMOSearchIndex === index && currentHMOSearchTerm.length >= 2 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {hmoTariffLoading ? (
                                <div className="p-4 text-center text-muted-foreground">
                                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                                  Searching HMO tariff...
                                </div>
                              ) : hmoTariffData && hmoTariffData.length > 0 ? (
                                <ul className="py-1">
                                  {hmoTariffData.map((tariff: any) => (
                                    <li
                                      key={tariff.id}
                                      onClick={() => handleHMOTariffSelect(index, tariff)}
                                      className="px-4 py-2 hover:bg-primary/10 cursor-pointer transition-colors border-b border-border last:border-b-0"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{tariff.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Code: {tariff.code} • {tariff.category}
                                          </p>
                                        </div>
                                        <div className="text-right ml-4">
                                          <p className="font-semibold text-primary">
                                            {formatCurrency(tariff.basePrice)}
                                          </p>
                                          <p className="text-xs text-muted-foreground">HMO Rate</p>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="p-4 text-center text-muted-foreground">
                                  <AlertCircle className="w-5 h-5 mx-auto mb-2 text-saffron" />
                                  <p className="text-sm">No tariffs found matching &quot;{currentHMOSearchTerm}&quot;</p>
                                </div>
                              )}
                            </div>
                          )}
                          {item.hmoTariffId && (
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                                HMO Tariff Applied
                              </span>
                              {item.isManualHMOOverride && (
                                <span className="text-xs px-2 py-0.5 rounded bg-saffron/10 text-saffron">
                                  Manual Override
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Select the HMO-approved service/procedure
                          </p>
                        </div>

                        {/* PA Authorization Code Field */}
                        <div>
                          <Input
                            label="PA Authorization Code"
                            value={item.paAuthCode || ''}
                            onChange={(e) => handlePACodeChange(index, e.target.value)}
                            placeholder="Enter PA code from HMO..."
                            autoComplete="off"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter the Prior Authorization code from the HMO
                          </p>
                        </div>
                      </>
                    )}

                    {/* Price Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        required
                      />

                      {isHMOPatient && item.hmoTariffId ? (
                        <>
                          {/* HMO Patient with PA Authorization */}
                          <div className="md:col-span-2">
                            <Input
                              label="Agreed HMO Price (₦)"
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.hmoTariffPrice || 0}
                              onChange={(e) => handleManualHMOPriceChange(index, e.target.value)}
                              placeholder="0.00"
                              required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.paAuthCode ? `HMO pays this amount (PA: ${item.paAuthCode})` : 'Enter negotiated price with HMO'}
                            </p>
                          </div>

                          <div>
                            <Input
                              label="Invoice Amount (₦)"
                              type="number"
                              value={item.unitPrice}
                              disabled
                              placeholder="0.00"
                            />
                            <p className="text-xs text-primary font-medium mt-1">
                              {item.paAuthCode ? '✓ HMO will pay this amount' : 'Enter PA code and price'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="md:col-span-2">
                          <Input
                            label="Unit Price (₦)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'inventoryPrice', parseFloat(e.target.value))}
                            placeholder="0.00"
                            required
                          />
                          {item.inventoryItemId && (
                            <p className="text-xs text-muted-foreground mt-1">Auto-populated from inventory</p>
                          )}
                        </div>
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
