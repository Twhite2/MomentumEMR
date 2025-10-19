'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { ArrowLeft, Save, Pill } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

export default function NewInventoryPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    drugName: '',
    genericName: '',
    category: 'Other',
    quantity: '',
    unitPrice: '',
    reorderLevel: '10',
    expiryDate: '',
    batchNumber: '',
    manufacturer: '',
  });

  // Create inventory item mutation
  const createItem = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/inventory', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Medication added successfully!');
      router.push(`/inventory/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add medication');
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Transform form data to match API expectations
    const apiData = {
      itemName: formData.drugName,
      itemCode: formData.batchNumber || null,
      stockQuantity: parseInt(formData.quantity) || 0,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      reorderLevel: parseInt(formData.reorderLevel) || 10,
      expiryDate: formData.expiryDate || null,
    };
    
    createItem.mutate(apiData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add Medication</h1>
          <p className="text-muted-foreground mt-1">Add new medication to inventory</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-border p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-green-haze" />
              Medication Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Drug Name"
                name="drugName"
                value={formData.drugName}
                onChange={handleInputChange}
                placeholder="e.g., Paracetamol 500mg"
                required
              />

              <Input
                label="Generic Name (Optional)"
                name="genericName"
                value={formData.genericName}
                onChange={handleInputChange}
                placeholder="e.g., Acetaminophen"
              />

              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="Antibiotic">Antibiotic</option>
                <option value="Analgesic">Analgesic</option>
                <option value="Antiviral">Antiviral</option>
                <option value="Vaccine">Vaccine</option>
                <option value="Supplement">Supplement</option>
                <option value="Other">Other</option>
              </Select>

              <Input
                label="Manufacturer (Optional)"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="e.g., Pfizer"
              />
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Stock Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Initial Quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="0"
                required
              />

              <Input
                label="Unit Price (₦)"
                name="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />

              <Input
                label="Reorder Level"
                name="reorderLevel"
                type="number"
                min="0"
                step="1"
                value={formData.reorderLevel}
                onChange={handleInputChange}
                placeholder="10"
                required
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Reorder level: You'll be alerted when stock falls to or below this quantity
            </p>
          </div>

          {/* Batch Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Batch Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Batch Number (Optional)"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                placeholder="e.g., BATCH-2024-001"
              />

              <Input
                label="Expiry Date (Optional)"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-green-haze/5 border border-green-haze/20 rounded-lg">
            <h3 className="font-semibold text-green-haze mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Drug Name:</span>
                <p className="font-medium">{formData.drugName || 'Not entered'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <p className="font-medium">{formData.category}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Initial Stock:</span>
                <p className="font-medium">{formData.quantity || '0'} units</p>
              </div>
              <div>
                <span className="text-muted-foreground">Unit Price:</span>
                <p className="font-medium">₦{formData.unitPrice || '0.00'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/inventory">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              loading={createItem.isPending}
              disabled={createItem.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
