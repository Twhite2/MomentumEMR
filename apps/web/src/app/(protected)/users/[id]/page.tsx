'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select } from '@momentum/ui';
import {
  ArrowLeft,
  Save,
  UserX,
  UserCheck,
  Shield,
  Mail,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
  });

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await axios.get(`/api/users/${userId}`);
      return response.data;
    },
  });

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
      });
    }
  }, [user]);

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('User updated successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user');
    },
  });

  // Toggle active status mutation
  const toggleStatus = useMutation({
    mutationFn: async (active: boolean) => {
      const response = await axios.put(`/api/users/${userId}`, { active });
      return response.data;
    },
    onSuccess: () => {
      toast.success('User status updated!');
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`/api/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('User deactivated successfully!');
      router.push('/users');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to deactivate user');
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
    const payload: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };
    // Only include password if it's been entered
    if (formData.password) {
      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
      payload.password = formData.password;
    }
    updateUser.mutate(payload);
  };

  const handleDeactivate = () => {
    if (confirm('Are you sure you want to deactivate this user?')) {
      deleteUser.mutate();
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-ribbon text-white',
      doctor: 'bg-tory-blue text-white',
      nurse: 'bg-green-haze text-white',
      pharmacist: 'bg-amaranth text-white',
      lab_tech: 'bg-danube text-white',
      cashier: 'bg-saffron text-black',
      receptionist: 'bg-purple-500 text-white',
      patient: 'bg-muted text-muted-foreground',
    };
    return colors[role] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-tory-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-ribbon mb-4">Failed to load user</p>
          <Link href="/users">
            <Button variant="outline">Back to Users</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground mt-1">{user.email}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-lg font-medium ${getRoleColor(user.role)}`}>
          {user.role.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">User Information</h2>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Details
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
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
                  <option value="lab_tech">Lab Scientist</option>
                  <option value="cashier">Cashier</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="patient">Patient</option>
                </Select>

                <Input
                  label="New Password (Optional)"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Leave blank to keep current password"
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={updateUser.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        password: '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium text-lg">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Role Permissions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Role Permissions</h2>
            <div className="text-sm text-muted-foreground">
              {user.role === 'admin' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Full system access and configuration</li>
                  <li>User management and role assignment</li>
                  <li>Access to all modules and data</li>
                  <li>System settings and hospital management</li>
                </ul>
              )}
              {user.role === 'doctor' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Patient management and registration</li>
                  <li>Appointment scheduling and management</li>
                  <li>Medical records and clinical documentation</li>
                  <li>Prescription creation</li>
                  <li>Lab order requests</li>
                </ul>
              )}
              {user.role === 'nurse' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Patient vitals recording</li>
                  <li>Appointment check-in</li>
                  <li>Task management</li>
                  <li>Basic patient information access</li>
                </ul>
              )}
              {user.role === 'pharmacist' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Prescription viewing and dispensing</li>
                  <li>Inventory management</li>
                  <li>Stock level monitoring</li>
                  <li>Medication catalog management</li>
                </ul>
              )}
              {user.role === 'lab_tech' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Lab order viewing</li>
                  <li>Test result uploads</li>
                  <li>Result management</li>
                </ul>
              )}
              {user.role === 'cashier' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Invoice creation and management</li>
                  <li>Payment recording</li>
                  <li>Financial tracking</li>
                  <li>Receipt generation</li>
                </ul>
              )}
              {user.role === 'receptionist' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Patient registration and check-in</li>
                  <li>Appointment scheduling and management</li>
                  <li>Front desk operations</li>
                  <li>Basic patient information access</li>
                </ul>
              )}
              {user.role === 'patient' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Personal medical records viewing</li>
                  <li>Appointment viewing</li>
                  <li>Prescription viewing</li>
                  <li>Lab results access</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Account Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span
                  className={`text-sm font-semibold ${
                    user.active ? 'text-green-haze' : 'text-muted-foreground'
                  }`}
                >
                  {user.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {user.active ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toggleStatus.mutate(false)}
                  loading={toggleStatus.isPending}
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Deactivate User
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => toggleStatus.mutate(true)}
                  loading={toggleStatus.isPending}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Activate User
                </Button>
              )}
            </div>
          </div>

          {/* Record Details */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Record Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created
                </p>
                <p className="font-medium mt-1">{formatDateTime(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last Updated
                </p>
                <p className="font-medium mt-1">{formatDateTime(user.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg border border-red-ribbon/20 p-6">
            <h2 className="text-lg font-semibold mb-4 text-red-ribbon">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Deactivating this user will prevent them from logging in. This action can be
              reversed.
            </p>
            <Button
              variant="outline"
              className="w-full text-red-ribbon border-red-ribbon hover:bg-red-ribbon/10"
              onClick={handleDeactivate}
              loading={deleteUser.isPending}
            >
              <UserX className="w-4 h-4 mr-2" />
              Deactivate Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
