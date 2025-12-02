'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { Save, Package, Pill } from 'lucide-react';
import { BackButton } from '@/components/shared/BackButton';
import axios from 'axios';
import { toast } from 'sonner';

export default function NewInventoryPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    drugName: '',
    genericName: '',
    category: 'Medication',
    drugCategory: '',
    dosageForm: '',
    dosageStrength: '',
    packagingUnit: 'tablet',
    tabletsPerPackage: '1',
    quantity: '',
    unitPrice: '',
    corporatePrice: '',
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
    const apiData: any = {
      itemName: formData.drugName,
      category: formData.category,
      stockQuantity: parseInt(formData.quantity) || 0,
      packagingUnit: formData.packagingUnit,
      tabletsPerPackage: parseInt(formData.tabletsPerPackage) || 1,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      reorderLevel: parseInt(formData.reorderLevel) || 10,
      expiryDate: formData.expiryDate || null,
    };

    // Only include itemCode if batch number is provided
    if (formData.batchNumber && formData.batchNumber.trim()) {
      apiData.itemCode = formData.batchNumber.trim();
    }

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
    
    createItem.mutate(apiData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
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
                placeholder="e.g., Paracetamol Tablet"
                required
              />

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
            
            {/* Package Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Select
                label="Packaging Unit"
                name="packagingUnit"
                value={formData.packagingUnit}
                onChange={handleInputChange}
              >
                <option value="tablet">Tablet/Capsule</option>
                <option value="blister_pack">Blister Pack</option>
                <option value="strip">Strip</option>
                <option value="bottle">Bottle</option>
                <option value="box">Box</option>
                <option value="vial">Vial/Ampoule</option>
                <option value="sachet">Sachet</option>
              </Select>

              <Input
                label="Units per Package"
                name="tabletsPerPackage"
                type="number"
                min="1"
                step="1"
                value={formData.tabletsPerPackage}
                onChange={handleInputChange}
                placeholder="e.g., 10 tablets per blister"
                required
              />

              <Input
                label="Initial Stock (Packages)"
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="0"
                required
              />
            </div>

            {/* Total Units Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Total Units in Stock</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {formData.quantity || 0} {formData.packagingUnit}s × {formData.tabletsPerPackage || 1} units each
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {(parseInt(formData.quantity) || 0) * (parseInt(formData.tabletsPerPackage) || 1)} units
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Unit Price (₦ per tablet)"
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
                label="Corporate Price (₦ per tablet)"
                name="corporatePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.corporatePrice}
                onChange={handleInputChange}
                placeholder="0.00"
              />

              <Input
                label="Reorder Level (Packages)"
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
              💡 Prices are per individual unit (tablet/capsule). Stock tracking is by package.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ⚠️ Reorder level: You'll be alerted when stock falls to or below this quantity
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
            <Button 
              variant="outline" 
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
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
