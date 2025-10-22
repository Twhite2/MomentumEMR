'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input } from '@momentum/ui';
import { MessageSquare, Plus, Search, CheckCircle, Clock, TrendingUp, BarChart3, X } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

export default function SurveysPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft' as 'draft' | 'active' | 'closed',
  });
  const queryClient = useQueryClient();

  // Fetch surveys and stats
  const { data: surveysData } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const response = await axios.get('/api/surveys');
      return response.data;
    },
  });

  // Create survey mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.post('/api/surveys', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Survey created successfully!');
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      setShowCreateModal(false);
      setFormData({ title: '', description: '', status: 'draft' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create survey');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Please enter a survey title');
      return;
    }
    createMutation.mutate(formData);
  };

  const surveys = surveysData?.surveys || [];
  const stats = surveysData?.stats || {};

  return (
    <>
      {/* Create Survey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary">Create New Survey</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Survey Title *</label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Post-Visit Patient Satisfaction"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the survey..."
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Survey'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <MessageSquare className="w-8 h-8" />
            Patient Surveys & Feedback
          </h1>
          <p className="text-muted-foreground mt-1">
            {session?.user?.role === 'patient'
              ? 'Share your feedback and help us improve'
              : 'Collect patient feedback and measure satisfaction'}
          </p>
        </div>
        {session?.user?.role !== 'patient' && (
          <Link href="/surveys/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Survey
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      {session?.user?.role === 'patient' ? (
        /* Patient View - Personal Feedback Stats */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Surveys</p>
                <p className="text-2xl font-bold text-primary mt-1">{stats.available || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending your feedback</p>
              </div>
              <MessageSquare className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Thank you!</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600/20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Avg. Rating</p>
                <p className="text-2xl font-bold text-primary mt-1">{stats.avgRating || 0}/5</p>
                <p className="text-xs text-muted-foreground mt-1">Your feedback score</p>
              </div>
              <BarChart3 className="w-10 h-10 text-primary/20" />
            </div>
          </div>
        </div>
      ) : (
        /* Staff View - Company Survey Stats */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Surveys</p>
                <p className="text-2xl font-bold text-primary mt-1">{stats.total || 0}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Surveys</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600/20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold text-primary mt-1">{stats.totalResponses?.toLocaleString() || 0}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Satisfaction</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.avgSatisfaction || 0}/5</p>
              </div>
              <BarChart3 className="w-10 h-10 text-green-600/20" />
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-border">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search surveys by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select className="px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Available Surveys / Survey Templates */}
      {session?.user?.role === 'patient' ? (
        /* Patient View - Available Surveys to Take */
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Available Surveys</h2>
          {surveys.length > 0 ? (
            <div className="space-y-4">
              {surveys.filter((survey: any) => survey.status === 'active').map((survey: any) => (
                <div key={survey.id} className="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">{survey.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(survey.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link href={`/surveys/${survey.id}`}>
                      <Button variant="primary" size="sm">Take Survey</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No surveys available</p>
              <p className="text-sm mt-2">Check back later for feedback opportunities</p>
            </div>
          )}
        </div>
      ) : (
        /* Staff View - Survey Templates */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Patient Satisfaction</h3>
                <p className="text-sm text-muted-foreground">Post-visit feedback</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Service Quality</h3>
                <p className="text-sm text-muted-foreground">Rate hospital services</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-600/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Custom Survey</h3>
                <p className="text-sm text-muted-foreground">Create from scratch</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Surveys List - Staff Only */}
      {session?.user?.role !== 'patient' && (
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-primary">All Surveys</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-sm">Survey Title</th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Responses</th>
                <th className="text-left p-4 font-semibold text-sm">Created</th>
                <th className="text-left p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {surveys.length > 0 ? (
                surveys.map((survey: any) => (
                  <tr key={survey.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{survey.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {survey.description || 'No description'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        survey.status === 'active' 
                          ? 'bg-green-600/10 text-green-600'
                          : survey.status === 'draft'
                          ? 'bg-yellow-600/10 text-yellow-600'
                          : 'bg-gray-600/10 text-gray-600'
                      }`}>
                        {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{survey.responseCount || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(survey.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Link href={`/surveys/${survey.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No surveys created yet</p>
                    <p className="text-sm mt-2">Create your first survey to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
      </div>
    </>
  );
}

