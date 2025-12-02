'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Select } from '@momentum/ui';
import { Save, TestTube } from 'lucide-react';
import { BackButton } from '@/components/shared/BackButton';
import axios from 'axios';
import { toast } from 'sonner';

export default function NewLabSupplyPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Lab', // Fixed category
    supplyType: '',
    packagingUnit: 'bottle',
    unitsPerPackage: '1',
    quantity: '',
    unitPrice: '',
    corporatePrice: '',
    reorderLevel: '10',
    expiryDate: '',
    batchNumber: '',
    manufacturer: '',
  });

  // Create supply mutation
  const createSupply = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/inventory', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Supply added successfully!');
      router.push('/lab/supplies');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add supply');
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const apiData: any = {
      itemName: formData.itemName,
      category: 'Lab',
      drugCategory: formData.supplyType || null,
      stockQuantity: parseInt(formData.quantity) || 0,
      packagingUnit: formData.packagingUnit,
      tabletsPerPackage: parseInt(formData.unitsPerPackage) || 1,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      reorderLevel: parseInt(formData.reorderLevel) || 10,
      expiryDate: formData.expiryDate || null,
    };

    console.log('🔍 Form Data:', formData);
    console.log('📤 Sending to API:', apiData);

    // Only include itemCode if batch number is provided
    if (formData.batchNumber && formData.batchNumber.trim()) {
      apiData.itemCode = formData.batchNumber.trim();
    }

    if (formData.corporatePrice) {
      apiData.corporatePrice = parseFloat(formData.corporatePrice);
    }
    
    createSupply.mutate(apiData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton label="Back to Supplies" />
        <div>
          <h1 className="text-3xl font-bold">Add Laboratory Supply</h1>
          <p className="text-muted-foreground mt-1">Add new supply to lab inventory</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-border p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TestTube className="w-5 h-5 text-purple-600" />
              Supply Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Supply Name"
                name="itemName"
                value={formData.itemName}
                onChange={handleInputChange}
                placeholder="e.g., Blood Reagent Kit, Test Strips"
                required
              />

              <Select
                label="Supply Type (Optional)"
                name="supplyType"
                value={formData.supplyType}
                onChange={handleInputChange}
              >
                <option value="">Select type...</option>
                <option value="Reagent">Reagents</option>
                <option value="Test Kit">Test Kits</option>
                <option value="Hematology">Hematology</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Serology">Serology</option>
                <option value="Culture Media">Culture Media</option>
                <option value="Consumables">Consumables</option>
                <option value="Stains">Stains & Dyes</option>
                <option value="Other">Other</option>
              </Select>

              <Input
                label="Manufacturer (Optional)"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="e.g., Roche, Abbott"
              />

              <Input
                label="Batch Number (Optional)"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                placeholder="e.g., BATCH-2024-001"
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
                <option value="bottle">Bottle</option>
                <option value="vial">Vial</option>
                <option value="kit">Kit</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
                <option value="tube">Tube</option>
                <option value="plate">Plate</option>
                <option value="unit">Individual Unit</option>
              </Select>

              <Input
                label="Units per Package"
                name="unitsPerPackage"
                type="number"
                min="1"
                step="1"
                value={formData.unitsPerPackage}
                onChange={handleInputChange}
                placeholder="e.g., 25 tests per kit"
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
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900">Total Units in Stock</p>
                  <p className="text-xs text-purple-700 mt-1">
                    {formData.quantity || 0} {formData.packagingUnit}s × {formData.unitsPerPackage || 1} units each
                  </p>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {(parseInt(formData.quantity) || 0) * (parseInt(formData.unitsPerPackage) || 1)} units
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Unit Price (₦ per item)"
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
                label="Corporate Price (₦ per item)"
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
              💡 Prices are per individual item. Stock tracking is by package.
            </p>
          </div>

          {/* Additional Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Expiry Date"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              ⚠️ Expiry date tracking is important for lab reagents and chemicals
            </p>
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
              loading={createSupply.isPending}
              disabled={createSupply.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Add Supply
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
