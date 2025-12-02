'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Select } from '@momentum/ui';
import { Plus, Users, Search, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import ExcelImportExport from '@/components/shared/ExcelImportExport';
import { getRoleDisplayName, ROLE_BADGE_BG_LIGHT, type UserRole } from '@/lib/role-utils';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<UsersResponse>({
    queryKey: ['users', searchQuery, role, active, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (searchQuery) params.append('search', searchQuery);
      if (role) params.append('role', role);
      if (active) params.append('active', active);

      const response = await axios.get(`/api/users?${params}`);
      return response.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  const getRoleColor = (role: string) => {
    return ROLE_BADGE_BG_LIGHT[role as UserRole] || 'bg-muted text-muted-foreground';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate stats
  const stats = data
    ? {
        total: data.pagination.total,
        active: data.users.filter((u) => u.active).length,
        inactive: data.users.filter((u) => !u.active).length,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage staff accounts and permissions</p>
        </div>
        <Link href="/users/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Excel Import/Export */}
      <ExcelImportExport
        title="Bulk Staff Registration"
        description="Download Excel template, fill offline, and upload for batch staff account creation"
        templateEndpoint="/api/users/excel/template"
        importEndpoint="/api/users/excel/import"
        templateFilename="Staff_Registration_Template"
        queryKey={['users']}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-haze">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10"
              />
            </div>
          </form>

          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="lab_tech">Lab Scientist</option>
            <option value="cashier">Cashier</option>
            <option value="receptionist">Receptionist</option>
            <option value="patient">Patient</option>
          </Select>

          <Select value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>

          {(role || active) && (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setRole('');
                setActive('');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load users</p>
          </div>
        ) : data?.users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found</p>
            <Link href="/users/new">
              <Button variant="primary" size="sm" className="mt-4">
                Add First User
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Email</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Role</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Created</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {user.active ? (
                          <span className="flex items-center justify-center gap-1 text-green-haze">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Active</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-muted-foreground">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Link href={`/users/${user.id}`}>
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to{' '}
                  {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

