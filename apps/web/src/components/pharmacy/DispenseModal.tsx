'use client';

import { useState } from 'react';
import { Button } from '@momentum/ui';
import { 
  CheckCircle, XCircle, Package, AlertTriangle, 
  DollarSign, FileText, X, Pill 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface PrescriptionItem {
  id: number;
  drugName: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  totalTablets: number | null;
  packagesNeeded: number | null;
  unitPrice: number | null;
  subtotal: number | null;
  hmoContribution: number | null;
  patientPays: number | null;
  inventory: {
    id: number;
    itemName: string;
    stockQuantity: number;
    tabletsPerPackage: number;
    packagingUnit: string;
  } | null;
}

interface DispenseModalProps {
  prescriptionId: number;
  patientName: string;
  items: PrescriptionItem[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function DispenseModal({
  prescriptionId,
  patientName,
  items,
  onSuccess,
  onCancel,
}: DispenseModalProps) {
  const [dispensing, setDispensing] = useState(false);

  // Calculate totals
  const totalTablets = items.reduce((sum, item) => sum + (item.totalTablets || 0), 0);
  const totalPackages = items.reduce((sum, item) => sum + (item.packagesNeeded || 0), 0);
  const totalCost = items.reduce((sum, item) => sum + (item.patientPays || item.subtotal || 0), 0);
  const totalHMO = items.reduce((sum, item) => sum + (item.hmoContribution || 0), 0);

  // Check stock availability
  const stockIssues = items.filter(item => {
    if (!item.inventory) return false;
    const packagesNeeded = item.packagesNeeded || 0;
    return item.inventory.stockQuantity < packagesNeeded;
  });

  const canDispense = stockIssues.length === 0;

  const handleDispense = async () => {
    if (!canDispense) {
      toast.error('Cannot dispense - insufficient stock');
      return;
    }

    setDispensing(true);
    try {
      const response = await axios.post(`/api/prescriptions/${prescriptionId}/dispense`);
      
      toast.success('Prescription dispensed successfully!');
      toast.info(`Invoice #${response.data.invoice.id} created`);
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to dispense prescription');
    } finally {
      setDispensing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dispense Prescription</h2>
            <p className="text-sm text-gray-600 mt-1">Patient: {patientName}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stock Status Alert */}
          {stockIssues.length > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">Insufficient Stock</h3>
                  <div className="mt-2 space-y-1">
                    {stockIssues.map((item, idx) => (
                      <p key={idx} className="text-sm text-red-700">
                        • {item.drugName}: Need {item.packagesNeeded} packages, 
                        only {item.inventory?.stockQuantity} available
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-900">✓ All items in stock and ready to dispense</p>
              </div>
            </div>
          )}

          {/* Medication List */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-gray-900">Medications to Dispense</h3>
            </div>
            <div className="divide-y divide-border">
              {items.map((item, idx) => {
                const hasStock = item.inventory && 
                  item.inventory.stockQuantity >= (item.packagesNeeded || 0);
                
                return (
                  <div key={idx} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Drug Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Pill className={`w-4 h-4 ${hasStock ? 'text-green-600' : 'text-red-600'}`} />
                          <h4 className="font-semibold text-gray-900">{item.drugName}</h4>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Dosage:</span> {item.dosage || 'N/A'} {' '}
                            <span className="font-medium">Frequency:</span> {item.frequency || 'N/A'} {' '}
                            <span className="font-medium">Duration:</span> {item.duration || 'N/A'}
                          </p>
                          {item.totalTablets && (
                            <p>
                              <span className="font-medium">Total:</span> {item.totalTablets} tablets
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stock & Pricing */}
                      <div className="text-right space-y-2">
                        {/* Stock Status */}
                        {item.inventory && (
                          <div className="flex items-center gap-2 justify-end">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm font-medium ${
                              hasStock ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.packagesNeeded || 0} of {item.inventory.stockQuantity} {item.inventory.packagingUnit}s
                            </span>
                          </div>
                        )}

                        {/* Price */}
                        <div className="text-sm">
                          {item.hmoContribution && item.hmoContribution > 0 ? (
                            <>
                              <p className="text-gray-500 line-through">₦{item.subtotal?.toFixed(2)}</p>
                              <p className="text-green-600 text-xs">HMO: -₦{item.hmoContribution.toFixed(2)}</p>
                              <p className="font-bold text-gray-900">₦{item.patientPays?.toFixed(2)}</p>
                            </>
                          ) : (
                            <p className="font-bold text-gray-900">₦{(item.patientPays || item.subtotal || 0).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3">Dispensing Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Tablets:</p>
                <p className="font-semibold text-gray-900">{totalTablets} tablets</p>
              </div>
              <div>
                <p className="text-gray-600">Total Packages:</p>
                <p className="font-semibold text-gray-900">{totalPackages} packages</p>
              </div>
              {totalHMO > 0 && (
                <>
                  <div>
                    <p className="text-gray-600">Subtotal:</p>
                    <p className="font-semibold text-gray-900">₦{(totalCost + totalHMO).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">HMO Coverage:</p>
                    <p className="font-semibold text-green-600">-₦{totalHMO.toFixed(2)}</p>
                  </div>
                </>
              )}
              <div className="col-span-2 pt-2 border-t border-purple-200">
                <p className="text-gray-600">Patient Pays:</p>
                <p className="text-2xl font-bold text-purple-900">₦{totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900">What happens when you dispense?</h4>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>✓ Stock will be deducted from inventory</li>
                  <li>✓ Invoice will be created automatically</li>
                  <li>✓ Prescription status will be marked as dispensed</li>
                  <li>✓ Your name will be recorded as dispensing pharmacist</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={dispensing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDispense}
            disabled={!canDispense || dispensing}
            loading={dispensing}
          >
            {dispensing ? 'Dispensing...' : 'Dispense & Create Invoice'}
          </Button>
        </div>
      </div>
    </div>
  );
}
