'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Select } from '@momentum/ui';
import { Save, Package } from 'lucide-react';
import { BackButton } from '@/components/shared/BackButton';
import axios from 'axios';
import { toast } from 'sonner';

export default function NewNursingSupplyPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Nursing', // Fixed category
    supplyType: '',
    packagingUnit: 'box',
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
      router.push('/nursing/supplies');
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
    
    console.log('=================================');
    console.log('🔍 NURSING FORM DATA:', formData);
    console.log('📦 Initial Stock field value:', formData.quantity);
    console.log('📊 Units per Package field value:', formData.unitsPerPackage);
    
    const apiData: any = {
      itemName: formData.itemName,
      category: 'Nursing',
      drugCategory: formData.supplyType || null,
      stockQuantity: parseInt(formData.quantity) || 0,
      packagingUnit: formData.packagingUnit,
      tabletsPerPackage: parseInt(formData.unitsPerPackage) || 1,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      reorderLevel: parseInt(formData.reorderLevel) || 10,
      expiryDate: formData.expiryDate || null,
    };

    console.log('📤 SENDING TO API:', apiData);
    console.log('📤 stockQuantity being sent:', apiData.stockQuantity);
    console.log('=================================');

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
          <h1 className="text-3xl font-bold">Add Nursing Supply</h1>
          <p className="text-muted-foreground mt-1">Add new supply to nursing inventory</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-border p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Supply Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Supply Name"
                name="itemName"
                value={formData.itemName}
                onChange={handleInputChange}
                placeholder="e.g., Sterile Bandage, IV Catheter"
                required
              />

              <Select
                label="Supply Type (Optional)"
                name="supplyType"
                value={formData.supplyType}
                onChange={handleInputChange}
              >
                <option value="">Select type...</option>
                <option value="Wound Care">Wound Care</option>
                <option value="IV Supplies">IV Supplies</option>
                <option value="Surgical">Surgical</option>
                <option value="Injection">Injection Equipment</option>
                <option value="Dressing">Dressing Materials</option>
                <option value="Catheter">Catheters</option>
                <option value="Gloves">Gloves & PPE</option>
                <option value="Other">Other</option>
              </Select>

              <Input
                label="Manufacturer (Optional)"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="e.g., 3M, Johnson & Johnson"
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
                <option value="box">Box</option>
                <option value="pack">Pack</option>
                <option value="roll">Roll</option>
                <option value="bottle">Bottle</option>
                <option value="bag">Bag</option>
                <option value="unit">Individual Unit</option>
                <option value="case">Case</option>
              </Select>

              <Input
                label="Units per Package"
                name="unitsPerPackage"
                type="number"
                min="1"
                step="1"
                value={formData.unitsPerPackage}
                onChange={handleInputChange}
                placeholder="e.g., 10 items per box"
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
                    {formData.quantity || 0} {formData.packagingUnit}s × {formData.unitsPerPackage || 1} units each
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-900">
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
                label="Expiry Date (Optional)"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleInputChange}
              />
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
