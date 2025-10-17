'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input } from '@momentum/ui';
import { MessageSquare, Plus, Search, CheckCircle, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function SurveysPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');

  return (
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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Survey
          </Button>
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
                <p className="text-2xl font-bold text-primary mt-1">3</p>
                <p className="text-xs text-muted-foreground mt-1">Pending your feedback</p>
              </div>
              <MessageSquare className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">5</p>
                <p className="text-xs text-muted-foreground mt-1">Thank you!</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600/20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Avg. Rating</p>
                <p className="text-2xl font-bold text-primary mt-1">4.5/5</p>
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
                <p className="text-2xl font-bold text-primary mt-1">24</p>
              </div>
              <MessageSquare className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Surveys</p>
                <p className="text-2xl font-bold text-green-600 mt-1">8</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600/20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold text-primary mt-1">1,547</p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Satisfaction</p>
                <p className="text-2xl font-bold text-green-600 mt-1">4.5/5</p>
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
        <>
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Available Surveys</h2>
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Post-Visit Patient Satisfaction</h3>
                      <p className="text-sm text-muted-foreground mt-1">Share your feedback about your recent appointment</p>
                      <p className="text-xs text-muted-foreground mt-2">Est. time: 5 minutes</p>
                    </div>
                  </div>
                  <Button variant="primary" size="sm">Take Survey</Button>
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Service Quality Rating</h3>
                      <p className="text-sm text-muted-foreground mt-1">Rate our hospital services and facilities</p>
                      <p className="text-xs text-muted-foreground mt-2">Est. time: 3 minutes</p>
                    </div>
                  </div>
                  <Button variant="primary" size="sm">Take Survey</Button>
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Doctor Consultation Feedback</h3>
                      <p className="text-sm text-muted-foreground mt-1">How was your experience with your doctor?</p>
                      <p className="text-xs text-muted-foreground mt-2">Est. time: 2 minutes</p>
                    </div>
                  </div>
                  <Button variant="primary" size="sm">Take Survey</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Completed Surveys</h2>
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>You have completed 5 surveys</p>
              <p className="text-sm mt-2">Thank you for your valuable feedback!</p>
            </div>
          </div>
        </>
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
              {/* Example row */}
              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div>
                    <p className="font-medium">Post-Visit Patient Satisfaction</p>
                    <p className="text-sm text-muted-foreground">
                      Feedback on doctor consultation and overall experience
                    </p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-600/10 text-green-600">
                    Active
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="font-semibold">247</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  2 weeks ago
                </td>
                <td className="p-4">
                  <Link href="/surveys/1">
                    <Button variant="outline" size="sm">
                      View Results
                    </Button>
                  </Link>
                </td>
              </tr>
              
              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div>
                    <p className="font-medium">Pharmacy Service Quality</p>
                    <p className="text-sm text-muted-foreground">
                      Rate medication dispensing and pharmacist support
                    </p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-600/10 text-green-600">
                    Active
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="font-semibold">156</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  1 month ago
                </td>
                <td className="p-4">
                  <Link href="/surveys/2">
                    <Button variant="outline" size="sm">
                      View Results
                    </Button>
                  </Link>
                </td>
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div>
                    <p className="font-medium">Facility Cleanliness Survey</p>
                    <p className="text-sm text-muted-foreground">
                      Hospital hygiene and cleanliness feedback
                    </p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-600/10 text-gray-600">
                    Closed
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">412</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  3 months ago
                </td>
                <td className="p-4">
                  <Link href="/surveys/3">
                    <Button variant="outline" size="sm">
                      View Results
                    </Button>
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}

