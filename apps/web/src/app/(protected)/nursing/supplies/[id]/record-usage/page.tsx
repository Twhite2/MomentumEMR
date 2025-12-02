'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { Save, Package, User, FileText } from 'lucide-react';
import { BackButton } from '@/components/shared/BackButton';
import axios from 'axios';
import { toast } from 'sonner';

export default function RecordNursingUsagePage() {
  const router = useRouter();
  const params = useParams();
  const supplyId = params.id as string;
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    patientId: '',
    quantity: '1',
    purpose: '',
    notes: '',
  });

  // Fetch supply details
  const { data: supply, isLoading: loadingSupply } = useQuery({
    queryKey: ['supply', supplyId],
    queryFn: async () => {
      const response = await axios.get(`/api/inventory/${supplyId}`);
      return response.data;
    },
  });

  // Fetch patients
  const { data: patients } = useQuery({
    queryKey: ['patients-active'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?status=active');
      return response.data;
    },
  });

  // Record usage mutation
  const recordUsage = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/nursing/supplies/record-usage', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Usage recorded successfully!');
      router.push('/nursing/supplies');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record usage');
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

    if (!formData.patientId) {
      toast.error('Please select a patient');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (!quantity || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (supply && quantity > supply.stockQuantity) {
      toast.error(`Only ${supply.stockQuantity} units available in stock`);
      return;
    }

    recordUsage.mutate({
      inventoryId: parseInt(supplyId),
      patientId: parseInt(formData.patientId),
      quantity,
      purpose: formData.purpose || null,
      notes: formData.notes || null,
    });
  };

  if (loadingSupply) {
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
        <BackButton label="Back to Supplies" />
        <div>
          <h1 className="text-3xl font-bold">Record Supply Usage</h1>
          <p className="text-muted-foreground mt-1">
            Record usage of {supply?.itemName}
          </p>
        </div>
      </div>

      {/* Supply Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">{supply?.itemName}</h3>
            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Available Stock:</p>
                <p className="font-bold text-blue-900">{supply?.stockQuantity} units</p>
              </div>
              <div>
                <p className="text-blue-700">Unit Price:</p>
                <p className="font-bold text-blue-900">₦{parseFloat(supply?.unitPrice || 0).toLocaleString()}</p>
              </div>
              {supply?.tabletsPerPackage > 1 && (
                <div>
                  <p className="text-blue-700">Total Items:</p>
                  <p className="font-bold text-blue-900">
                    {supply.stockQuantity * supply.tabletsPerPackage} items
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-border p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-haze" />
              Patient Information
            </h2>
            <Select
              label="Patient"
              name="patientId"
              value={formData.patientId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select patient...</option>
              {patients?.patients?.map((patient: any) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} (ID: P-{patient.id.toString().padStart(6, '0')})
                </option>
              ))}
            </Select>
          </div>

          {/* Usage Details */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-haze" />
              Usage Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Quantity Used"
                name="quantity"
                type="number"
                min="1"
                max={supply?.stockQuantity || 999}
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="1"
                required
              />

              <Input
                label="Purpose/Procedure"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="e.g., Wound dressing, IV setup"
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Additional Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Any additional notes about this usage..."
              />
            </div>
          </div>

          {/* Cost Summary */}
          {formData.quantity && parseInt(formData.quantity) > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Cost Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-purple-700">Quantity:</p>
                  <p className="font-bold text-purple-900">{formData.quantity} units</p>
                </div>
                <div>
                  <p className="text-purple-700">Unit Price:</p>
                  <p className="font-bold text-purple-900">
                    ₦{parseFloat(supply?.unitPrice || 0).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-purple-200">
                  <p className="text-purple-700">Total Cost:</p>
                  <p className="text-xl font-bold text-purple-900">
                    ₦{(parseInt(formData.quantity) * parseFloat(supply?.unitPrice || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                💡 This will be added to the patient's invoice
              </p>
            </div>
          )}

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
              loading={recordUsage.isPending}
              disabled={recordUsage.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Record Usage
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
