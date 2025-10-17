'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Shield, ArrowLeft, CheckCircle, XCircle, FileText, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

export default function InsurancePage() {
  const { data: session } = useSession();

  // Fetch patient's insurance information
  const { data: insuranceData, isLoading } = useQuery({
    queryKey: ['patient-insurance'],
    queryFn: async () => {
      const response = await axios.get('/api/patients/me');
      return response.data;
    },
    enabled: session?.user?.role === 'patient',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/billing">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Insurance Coverage
        </h1>
        <p className="text-muted-foreground mt-1">
          View your health insurance plan details and coverage
        </p>
      </div>

      {/* Insurance Card */}
      <div className="bg-gradient-to-br from-primary to-tory-blue text-white rounded-xl p-8 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-90 mb-2">Insurance Plan</p>
            <h2 className="text-2xl font-bold mb-1">
              {insuranceData?.hmo?.policyName || 'Premium Health Plus'}
            </h2>
            <p className="text-sm opacity-90">
              {insuranceData?.hmo?.provider || 'HealthGuard Insurance'}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <Shield className="w-8 h-8" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm opacity-90">Member ID</p>
            <p className="text-lg font-semibold">HG-{insuranceData?.id || '000123'}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Patient Type</p>
            <p className="text-lg font-semibold capitalize">
              {insuranceData?.patientType?.replace('_', ' ') || 'HMO'}
            </p>
          </div>
        </div>
      </div>

      {/* Coverage Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-border">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Covered Services
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">General Consultations (100% covered)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Laboratory Tests (80% covered)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Prescribed Medications (70% covered)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Emergency Care (100% covered)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Imaging Services (60% covered)</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Exclusions
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Cosmetic Procedures</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Pre-existing Conditions (first 6 months)</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Alternative Medicine</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Dental & Vision (separate plans required)</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Non-emergency International Care</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Coverage Limits */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h3 className="font-semibold text-lg mb-4">Annual Coverage Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Annual Limit</p>
            <p className="text-2xl font-bold text-primary mt-1">₦2,000,000</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Used This Year</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">₦125,000</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: '6.25%' }}></div>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining Balance</p>
            <p className="text-2xl font-bold text-green-600 mt-1">₦1,875,000</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h3 className="font-semibold text-lg mb-4">Insurance Provider Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold">+234 800 123 4567</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">support@healthguard.ng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/invoices" className="flex-1">
          <Button variant="primary" className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            View My Bills
          </Button>
        </Link>
        <Button variant="outline" className="flex-1">
          <FileText className="w-4 h-4 mr-2" />
          Download Insurance Card
        </Button>
      </div>
    </div>
  );
}
