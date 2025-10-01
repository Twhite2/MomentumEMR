'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import { Building2, ArrowLeft, Save, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

interface Hospital {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  contactEmail: string;
  subscriptionPlan: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function HospitalDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const hospitalId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);

  const { data: hospital, isLoading } = useQuery<Hospital>({
    queryKey: ['hospital', hospitalId],
    queryFn: async () => {
      const response = await axios.get(`/api/hospitals/${hospitalId}`);
      return response.data;
    },
  });

  const [formData, setFormData] = useState({
    name: hospital?.name || '',
    address: hospital?.address || '',
    phoneNumber: hospital?.phoneNumber || '',
    contactEmail: hospital?.contactEmail || '',
    subscriptionPlan: hospital?.subscriptionPlan || 'Basic',
    active: hospital?.active ?? true,
  });

  // Update form data when hospital data loads
  if (hospital && !isEditing && formData.name === '') {
    setFormData({
      name: hospital.name,
      address: hospital.address,
      phoneNumber: hospital.phoneNumber,
      contactEmail: hospital.contactEmail,
      subscriptionPlan: hospital.subscriptionPlan,
      active: hospital.active,
    });
  }

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.put(`/api/hospitals/${hospitalId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Hospital updated successfully');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
    onError: () => {
      toast.error('Failed to update hospital');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading hospital details...</div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Hospital not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hospitals">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-tory-blue flex items-center gap-2">
              <Building2 className="w-8 h-8" />
              {hospital.name}
            </h1>
            <p className="text-muted-foreground mt-1">Hospital ID: {hospital.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Details</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hospital Details Form */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-tory-blue mb-4">Hospital Information</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Hospital Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subscription Plan</label>
              <select
                value={formData.subscriptionPlan}
                onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue disabled:bg-muted disabled:cursor-not-allowed"
              >
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground mt-2" />
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                rows={3}
                className="flex-1 px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue disabled:bg-muted disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-tory-blue focus:ring-tory-blue border-border rounded disabled:cursor-not-allowed"
            />
            <label htmlFor="active" className="text-sm font-medium">
              Hospital Active
            </label>
          </div>
        </form>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-tory-blue mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span>Created At</span>
            </div>
            <p className="font-medium">{new Date(hospital.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span>Last Updated</span>
            </div>
            <p className="font-medium">{new Date(hospital.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
