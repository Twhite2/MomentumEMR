'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Input, Select } from '@momentum/ui';
import { ArrowLeft, Save, Pill } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params.id as string;

  const [formData, setFormData] = useState({
    drugName: '',
    category: 'Medication',
    drugCategory: '',
    dosageForm: '',
    dosageStrength: '',
    quantity: '',
    unitPrice: '',
    corporatePrice: '',
    reorderLevel: '10',
    expiryDate: '',
    batchNumber: '',
  });

  // Fetch existing inventory item
  const { data: inventoryItem, isLoading } = useQuery({
    queryKey: ['inventory', inventoryId],
    queryFn: async () => {
      const response = await axios.get(`/api/inventory/${inventoryId}`);
      return response.data;
    },
    enabled: !!inventoryId,
  });

  // Populate form when data loads
  useEffect(() => {
    if (inventoryItem) {
      setFormData({
        drugName: inventoryItem.itemName || '',
        category: inventoryItem.category || 'Medication',
        drugCategory: inventoryItem.drugCategory || '',
        dosageForm: inventoryItem.dosageForm || '',
        dosageStrength: inventoryItem.dosageStrength || '',
        quantity: inventoryItem.stockQuantity?.toString() || '',
        unitPrice: inventoryItem.unitPrice?.toString() || '',
        corporatePrice: inventoryItem.corporatePrice?.toString() || '',
        reorderLevel: inventoryItem.reorderLevel?.toString() || '10',
        expiryDate: inventoryItem.expiryDate ? new Date(inventoryItem.expiryDate).toISOString().split('T')[0] : '',
        batchNumber: inventoryItem.itemCode || '',
      });
    }
  }, [inventoryItem]);

  // Update inventory item mutation
  const updateItem = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.patch(`/api/inventory/${inventoryId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Medication updated successfully!');
      router.push(`/inventory/${inventoryId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update medication');
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
    const apiData: any = {
      itemName: formData.drugName,
      itemCode: formData.batchNumber || null,
      stockQuantity: parseInt(formData.quantity) || 0,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      reorderLevel: parseInt(formData.reorderLevel) || 10,
      expiryDate: formData.expiryDate || null,
      category: formData.category,
    };

    // Add optional fields if provided
    if (formData.corporatePrice) {
      apiData.corporatePrice = parseFloat(formData.corporatePrice);
    }
    if (formData.drugCategory) {
      apiData.drugCategory = formData.drugCategory;
    }
    if (formData.dosageForm) {
      apiData.dosageForm = formData.dosageForm;
    }
    if (formData.dosageStrength) {
      apiData.dosageStrength = formData.dosageStrength;
    }
    
    updateItem.mutate(apiData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/inventory/${inventoryId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Details
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Medication</h1>
          <p className="text-muted-foreground mt-1">Update medication information</p>
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

              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="Medication">Medication</option>
                <option value="Supply">Supply</option>
                <option value="Equipment">Equipment</option>
                <option value="Lab">Lab</option>
                <option value="Nursing">Nursing</option>
              </Select>

              <Select
                label="Drug Category (Optional)"
                name="drugCategory"
                value={formData.drugCategory}
                onChange={handleInputChange}
              >
                <option value="">Select category...</option>
                <option value="Antimalarial">Antimalarial</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Analgesic">Analgesic</option>
                <option value="Antifungal">Antifungal</option>
                <option value="Antiviral">Antiviral</option>
                <option value="Antihypertensive">Antihypertensive</option>
                <option value="Anti-diabetic">Anti-diabetic</option>
                <option value="NSAIDs">NSAIDs</option>
                <option value="Other">Other</option>
              </Select>

              <Input
                label="Dosage Form (Optional)"
                name="dosageForm"
                value={formData.dosageForm}
                onChange={handleInputChange}
                placeholder="e.g., Tablet, Syrup, Injection"
              />

              <Input
                label="Dosage Strength (Optional)"
                name="dosageStrength"
                value={formData.dosageStrength}
                onChange={handleInputChange}
                placeholder="e.g., 500mg, 250mg/5ml"
              />
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Stock Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Current Quantity"
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
                label="Corporate Price (₦)"
                name="corporatePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.corporatePrice}
                onChange={handleInputChange}
                placeholder="0.00"
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
          <div className="p-4 bg-blue-50 border border-tory-blue/20 rounded-lg">
            <h3 className="font-semibold text-tory-blue mb-2">Summary</h3>
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
                <span className="text-muted-foreground">Current Stock:</span>
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
            <Link href={`/inventory/${inventoryId}`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              loading={updateItem.isPending}
              disabled={updateItem.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Update Medication
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
