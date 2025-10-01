'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Select } from '@momentum/ui';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

export default function NewUserPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'nurse',
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/users', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('User created successfully!');
      router.push(`/users/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create user');
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const { confirmPassword, ...payload } = formData;
    createUser.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New User</h1>
          <p className="text-muted-foreground mt-1">Create a new staff account</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-border p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-tory-blue" />
              User Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Dr. John Doe"
                required
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="user@example.com"
                required
              />

              <Select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="lab_tech">Lab Technician</option>
                <option value="cashier">Cashier</option>
                <option value="patient">Patient</option>
              </Select>
            </div>
          </div>

          {/* Password Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimum 8 characters"
                required
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter password"
                required
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Password must be at least 8 characters long
            </p>
          </div>

          {/* Role Information */}
          <div className="p-4 bg-tory-blue/5 border border-tory-blue/20 rounded-lg">
            <h3 className="font-semibold text-tory-blue mb-2">Role Permissions</h3>
            <div className="text-sm text-muted-foreground">
              {formData.role === 'admin' && (
                <p>Full system access including user management and system configuration.</p>
              )}
              {formData.role === 'doctor' && (
                <p>Access to patients, appointments, medical records, prescriptions, and lab orders.</p>
              )}
              {formData.role === 'nurse' && (
                <p>Access to patients, appointments, vitals recording, and task management.</p>
              )}
              {formData.role === 'pharmacist' && (
                <p>Access to prescriptions, inventory management, and dispensing workflow.</p>
              )}
              {formData.role === 'lab_tech' && (
                <p>Access to lab orders, result uploads, and test management.</p>
              )}
              {formData.role === 'cashier' && (
                <p>Access to billing, invoicing, payment recording, and financial reports.</p>
              )}
              {formData.role === 'patient' && (
                <p>Access to personal medical records, appointments, and prescriptions.</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-green-haze/5 border border-green-haze/20 rounded-lg">
            <h3 className="font-semibold text-green-haze mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{formData.name || 'Not entered'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{formData.email || 'Not entered'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Role:</span>
                <p className="font-medium capitalize">{formData.role.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-medium text-green-haze">Active</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/users">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              loading={createUser.isPending}
              disabled={createUser.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
