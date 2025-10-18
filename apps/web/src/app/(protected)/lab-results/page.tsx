'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input } from '@momentum/ui';
import { TestTube, Search, Download, FileText, Calendar, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface LabResult {
  id: number;
  resultNotes: string | null;
  doctorNote: string | null;
  releasedAt: string;
  labOrder: {
    orderType: string;
    doctor: {
      name: string;
    };
  };
  releaser: {
    name: string;
  } | null;
  labResultValues: Array<{
    testName: string;
    resultValue: string;
    unit: string;
    normalRange: string;
  }>;
}

export default function LabResultsPage() {
  const { data: session } = useSession();
  const isLabTech = session?.user?.role === 'lab_tech';
  const isPatient = session?.user?.role === 'patient';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState('');

  // Fetch lab results based on role
  const { data, isLoading } = useQuery({
    queryKey: isLabTech ? ['all-lab-results'] : ['patient-lab-results'],
    queryFn: async () => {
      const endpoint = isLabTech ? '/api/lab-results' : '/api/lab-results/patient';
      const response = await axios.get(endpoint);
      return response.data;
    },
  });

  // Filter results based on search term and test type
  const filteredResults = useMemo(() => {
    const resultsArray = isLabTech ? data?.results : data?.releasedResults;
    if (!resultsArray) return [];

    return resultsArray.filter((result: any) => {
      const matchesSearch =
        searchTerm === '' ||
        result.labOrder.orderType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.labOrder.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (result.labOrder.patient && 
          `${result.labOrder.patient.firstName} ${result.labOrder.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (result.releasedAt && new Date(result.releasedAt).toLocaleDateString().includes(searchTerm));

      const matchesType =
        testTypeFilter === '' ||
        result.labOrder.orderType.toLowerCase().includes(testTypeFilter.toLowerCase());

      return matchesSearch && matchesType;
    });
  }, [isLabTech, data?.results, data?.releasedResults, searchTerm, testTypeFilter]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <TestTube className="w-8 h-8" />
          {isLabTech ? 'Lab Results Management' : 'My Lab Results'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isLabTech 
            ? 'Manage and track all laboratory test results' 
            : 'View your laboratory test results and reports'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Results</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {isLoading ? '...' : data?.stats?.totalResults || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </div>
            <TestTube className="w-10 h-10 text-primary/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recent Results</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {isLoading ? '...' : data?.stats?.recentResults || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600/20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Results</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {isLoading ? '...' : data?.stats?.pendingResults || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </div>
            <Clock className="w-10 h-10 text-orange-600/20" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-border">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by test name or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select 
            className="px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue"
            value={testTypeFilter}
            onChange={(e) => setTestTypeFilter(e.target.value)}
          >
            <option value="">All Tests</option>
            <option value="lab">Lab Tests</option>
            <option value="x_ray">X-Ray</option>
            <option value="ct">CT Scan</option>
            <option value="mri">MRI</option>
            <option value="ultrasound">Ultrasound</option>
            <option value="pathology">Pathology</option>
          </select>
        </div>
      </div>

      {/* Lab Results List */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-primary">Released Lab Results</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Results reviewed and released by your doctor
          </p>
        </div>
        
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading lab results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-12 text-center">
              <TestTube className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">
                {searchTerm || testTypeFilter 
                  ? 'No results match your search criteria'
                  : 'No lab results available yet'}
              </p>
              {searchTerm || testTypeFilter ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setTestTypeFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          ) : (
            filteredResults.map((result: any) => (
              <div key={result.id} className="p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <TestTube className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{result.labOrder.orderType.replace('_', ' ')}</h3>
                        {isLabTech && result.labOrder.patient && (
                          <p className="text-sm font-medium text-foreground">
                            Patient: {result.labOrder.patient.firstName} {result.labOrder.patient.lastName}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Ordered by Dr. {result.labOrder.doctor.name}
                        </p>
                      </div>
                    </div>

                    <div className="ml-15 space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Released: {formatDateTime(result.releasedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          Released by {result.releaser?.name || 'doctor'}
                        </span>
                      </div>
                      
                      {result.doctorNote && (
                        <div className="mt-3 p-4 bg-green-50 border-l-4 border-green-600 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-green-900">Message from Dr. {result.labOrder.doctor.name}</p>
                              <p className="text-sm text-green-800 mt-1 whitespace-pre-wrap">
                                {result.doctorNote}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {result.resultNotes && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium text-foreground">Lab Technician Notes:</p>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {result.resultNotes}
                          </p>
                        </div>
                      )}

                      {result.labResultValues && result.labResultValues.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-foreground mb-2">Test Values:</p>
                          <div className="space-y-1">
                            {result.labResultValues.map((value: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="font-medium">{value.testName}</span>
                                <span>
                                  {value.resultValue} {value.unit}
                                  {value.normalRange && (
                                    <span className="text-muted-foreground ml-2">
                                      (Normal: {value.normalRange})
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button variant="primary" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Results Info */}
      {data && data.pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900">Pending Lab Results</h3>
              <p className="text-sm text-amber-800 mt-1">
                You have {data.pendingCount} lab test(s) that are currently being reviewed by your doctor. 
                Results will appear here once they have been reviewed and released.
              </p>
              {data.pendingOrders && data.pendingOrders.length > 0 && (
                <div className="mt-3 space-y-1">
                  {data.pendingOrders.map((order: any) => (
                    <p key={order.id} className="text-sm text-amber-800">
                      • {order.orderType.replace('_', ' ')} - Ordered by Dr. {order.doctor.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
