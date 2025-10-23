'use client';

import { useState } from 'react';
import { Button } from '@momentum/ui';
import { CreditCard, Plus, Edit, Check, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    interval: 'monthly',
    features: [''],
  });

  // Fetch subscription plans from API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await axios.get('/api/subscriptions');
      return response.data;
    },
  });

  const plans: SubscriptionPlan[] = data?.plans || [];
  const summary = data?.summary || { totalRevenue: 0, totalHospitals: 0, activePlans: 0 };

  const handleCreatePlan = () => {
    setFormData({
      name: '',
      price: '',
      interval: 'monthly',
      features: [''],
    });
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async () => {
    try {
      const features = formData.features.filter(f => f.trim() !== '');
      if (!formData.name || !formData.price || features.length === 0) {
        toast.error('Please fill all required fields');
        return;
      }

      await axios.post('/api/subscriptions', {
        name: formData.name,
        price: parseFloat(formData.price),
        interval: formData.interval,
        features,
      });

      toast.success('Subscription plan created successfully!');
      setShowCreateModal(false);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create plan');
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      interval: plan.interval,
      features: [...plan.features],
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedPlan) return;

    try {
      const features = formData.features.filter(f => f.trim() !== '');
      if (!formData.name || !formData.price || features.length === 0) {
        toast.error('Please fill all required fields');
        return;
      }

      await axios.put('/api/subscriptions', {
        id: selectedPlan.id,
        name: formData.name,
        price: parseFloat(formData.price),
        interval: formData.interval,
        features,
      });

      toast.success('Subscription plan updated successfully!');
      setShowEditModal(false);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update plan');
    }
  };

  const handleTogglePlanStatus = async (plan: SubscriptionPlan) => {
    try {
      await axios.put('/api/subscriptions', {
        id: plan.id,
        active: !plan.active,
      });

      toast.success(`Plan ${plan.active ? 'deactivated' : 'activated'} successfully!`);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to toggle plan status');
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };

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
        <Button onClick={handleCreatePlan}>
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
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleEditPlan(plan)}
              >
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
                onClick={() => handleTogglePlanStatus(plan)}
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

      {/* Create/Edit Plan Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary">
                {showCreateModal ? 'Create New Plan' : `Edit ${selectedPlan?.name} Plan`}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setShowCreateModal(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Plan Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Enterprise"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Price (NGN) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 150000"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium mb-1">Features *</label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Unlimited patients"
                      />
                      {formData.features.length > 1 && (
                        <Button
                          variant="outline"
                          onClick={() => removeFeature(index)}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={addFeature}
                  className="mt-2"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setShowCreateModal(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={showCreateModal ? handleSubmitCreate : handleSubmitEdit}
                  className="flex-1"
                >
                  {showCreateModal ? 'Create Plan' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

