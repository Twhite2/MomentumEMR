'use client';

import { Button } from '@momentum/ui';
import { CreditCard, Plus, Edit, Check, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  hospitals: number;
  active: boolean;
}

export default function SubscriptionsPage() {
  // Fetch subscription plans from API
  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await axios.get('/api/subscriptions');
      return response.data;
    },
  });

  const plans: SubscriptionPlan[] = data?.plans || [];
  const summary = data?.summary || { totalRevenue: 0, totalHospitals: 0, activePlans: 0 };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <CreditCard className="w-8 h-8" />
            Subscription Plans
          </h1>
          <p className="text-muted-foreground mt-1">Loading subscription data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <CreditCard className="w-8 h-8" />
            Subscription Plans
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage pricing and features for hospital subscriptions
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Total Revenue (Monthly)</p>
          <p className="text-3xl font-bold text-primary mt-1">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Active Plans</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {summary.activePlans}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Subscribed Hospitals</p>
          <p className="text-3xl font-bold text-primary mt-1">
            {summary.totalHospitals}
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg border-2 transition-all ${
              plan.name === 'Premium'
                ? 'border-primary shadow-lg scale-105'
                : 'border-border'
            }`}
          >
            {/* Plan Header */}
            <div className="p-6 border-b border-border">
              {plan.name === 'Premium' && (
                <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full mb-3">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-2xl font-bold text-primary">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {plan.hospitals} hospitals subscribed
              </p>
            </div>

            {/* Features */}
            <div className="p-6">
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-border space-y-2">
              <Button variant="outline" className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit Plan
              </Button>
              <Button
                variant="outline"
                className={`w-full ${
                  plan.active
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {plan.active ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Comparison Table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-primary">Feature Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 font-semibold">Feature</th>
                <th className="text-center p-4 font-semibold">Basic</th>
                <th className="text-center p-4 font-semibold">Standard</th>
                <th className="text-center p-4 font-semibold">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-4">Maximum Patients</td>
                <td className="p-4 text-center">100</td>
                <td className="p-4 text-center">500</td>
                <td className="p-4 text-center">Unlimited</td>
              </tr>
              <tr>
                <td className="p-4">Staff Accounts</td>
                <td className="p-4 text-center">5</td>
                <td className="p-4 text-center">20</td>
                <td className="p-4 text-center">Unlimited</td>
              </tr>
              <tr>
                <td className="p-4">Email Support</td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="p-4">Phone Support</td>
                <td className="p-4 text-center">
                  <X className="w-5 h-5 text-red-600 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <X className="w-5 h-5 text-red-600 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="p-4">Lab Integration</td>
                <td className="p-4 text-center">
                  <X className="w-5 h-5 text-red-600 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="p-4">API Access</td>
                <td className="p-4 text-center">
                  <X className="w-5 h-5 text-red-600 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <X className="w-5 h-5 text-red-600 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="p-4">Dedicated Account Manager</td>
                <td className="p-4 text-center">
                  <X className="w-5 h-5 text-red-600 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <X className="w-5 h-5 text-red-600 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

