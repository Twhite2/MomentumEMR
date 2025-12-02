'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Calculator, Package, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

interface PrescriptionCalculatorProps {
  inventoryId: number | null;
  patientId: number | null;
  dosage: string;
  frequency: string;
  duration: string;
  onCalculationComplete?: (data: CalculationResult) => void;
}

interface CalculationResult {
  dosageCount: number;
  frequencyCount: number;
  durationValue: number;
  durationUnit: string;
  totalTablets: number;
  packagesNeeded: number;
  unitsFromPackages: number;
  excessTablets: number;
  unitPrice: number;
  subtotal: number;
  hmoContribution: number;
  patientPays: number;
  drugName: string;
  dosageStrength: string | null;
  dosageForm: string | null;
  tabletsPerPackage: number;
  currentStock: number;
  stockAvailable: boolean;
  shortage: number;
  patientType: string;
  patientName: string;
  hmoName: string | null;
}

export function PrescriptionCalculator({
  inventoryId,
  patientId,
  dosage,
  frequency,
  duration,
  onCalculationComplete,
}: PrescriptionCalculatorProps) {
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset when inputs change
    setCalculation(null);
    setError(null);

    // Only calculate if we have all required fields
    if (!inventoryId || !patientId || !dosage || !frequency || !duration) {
      return;
    }

    // Debounce the calculation
    const timer = setTimeout(() => {
      calculateCost();
    }, 500);

    return () => clearTimeout(timer);
  }, [inventoryId, patientId, dosage, frequency, duration]);

  const calculateCost = async () => {
    if (!inventoryId || !patientId || !dosage || !frequency || !duration) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/prescriptions/calculate-cost', {
        inventoryId,
        patientId,
        dosage,
        frequency,
        duration,
      });

      const calcData = response.data.calculation;
      setCalculation(calcData);
      
      // Notify parent component
      if (onCalculationComplete) {
        onCalculationComplete(calcData);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to calculate cost');
      setCalculation(null);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no inputs
  if (!inventoryId || !patientId || !dosage || !frequency || !duration) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Calculator className="w-5 h-5 text-blue-600 animate-pulse" />
          <p className="text-sm text-blue-900">Calculating prescription cost...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      </div>
    );
  }

  // No calculation yet
  if (!calculation) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Stock Availability */}
      <div className={`border rounded-lg p-4 ${
        calculation.stockAvailable 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          {calculation.stockAvailable ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              calculation.stockAvailable ? 'text-green-900' : 'text-red-900'
            }`}>
              {calculation.stockAvailable 
                ? '✓ Stock Available' 
                : '⚠️ Insufficient Stock'}
            </p>
            <p className={`text-xs mt-1 ${
              calculation.stockAvailable ? 'text-green-700' : 'text-red-700'
            }`}>
              {calculation.stockAvailable 
                ? `${calculation.currentStock} packages available (${calculation.currentStock * calculation.tabletsPerPackage} tablets)`
                : `Need ${calculation.packagesNeeded} packages, only ${calculation.currentStock} available (shortage: ${calculation.shortage} packages)`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Calculation Breakdown */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">Prescription Calculation</h3>
        </div>

        <div className="space-y-2 text-sm">
          {/* Formula */}
          <div className="bg-white rounded p-3 border border-blue-100">
            <p className="text-xs text-gray-600 mb-1">Formula:</p>
            <p className="font-mono text-blue-900">
              {calculation.dosageCount} tablet × {calculation.frequencyCount} times/day × {calculation.durationValue} {calculation.durationUnit} = <span className="font-bold">{calculation.totalTablets} tablets</span>
            </p>
          </div>

          {/* Packages */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700">Packages to dispense:</span>
            </div>
            <span className="font-semibold text-blue-900">
              {calculation.packagesNeeded} {calculation.packagesNeeded === 1 ? 'package' : 'packages'}
            </span>
          </div>

          {/* Units from packages */}
          <div className="text-xs text-gray-600 pl-6">
            Patient receives: {calculation.unitsFromPackages} tablets
            {calculation.excessTablets > 0 && (
              <span className="text-orange-600"> (+{calculation.excessTablets} extra)</span>
            )}
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-purple-900">Cost Breakdown</h3>
        </div>

        <div className="space-y-2 text-sm">
          {/* Patient Type */}
          <div className="flex items-center justify-between pb-2 border-b border-purple-100">
            <span className="text-gray-700">Patient Type:</span>
            <span className="font-medium text-purple-900 capitalize">
              {calculation.patientType === 'hmo' && calculation.hmoName 
                ? `HMO (${calculation.hmoName})` 
                : calculation.patientType}
            </span>
          </div>

          {/* Unit Price */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Price per tablet:</span>
            <span className="font-medium text-purple-900">₦{calculation.unitPrice.toFixed(2)}</span>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Subtotal ({calculation.totalTablets} tablets):</span>
            <span className="font-medium text-purple-900">₦{calculation.subtotal.toFixed(2)}</span>
          </div>

          {/* HMO Contribution */}
          {calculation.patientType === 'hmo' && calculation.hmoContribution > 0 && (
            <div className="flex items-center justify-between text-green-700">
              <span>HMO Coverage:</span>
              <span className="font-medium">-₦{calculation.hmoContribution.toFixed(2)}</span>
            </div>
          )}

          {/* Patient Pays */}
          <div className="flex items-center justify-between pt-2 border-t border-purple-200">
            <span className="font-semibold text-purple-900">Patient Pays:</span>
            <span className="text-xl font-bold text-purple-900">₦{calculation.patientPays.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
