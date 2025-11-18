'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button, Input } from '@momentum/ui';
import {
  Activity,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Users,
  Building2,
  TestTube,
  Settings,
  Download,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DiseaseAnalyticsPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportingComprehensive, setExportingComprehensive] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // Fetch disease analytics
  const { data: diseaseData, isLoading } = useQuery({
    queryKey: ['analytics-diseases', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const response = await axios.get(`/api/analytics/diseases?${params}`);
      return response.data;
    },
  });

  // Fetch privacy settings
  const { data: privacySettings } = useQuery({
    queryKey: ['analytics-privacy'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/privacy');
      return response.data;
    },
  });

  // Update privacy settings
  const updatePrivacyMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await axios.put('/api/analytics/privacy', settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-privacy'] });
      setShowSettings(false);
    },
  });

  const handleExportData = () => {
    if (!diseaseData) return;
    
    const csvContent = [
      ['Disease', 'Total Cases', 'Unique Patients', 'Affected Hospitals', 'Trend', 'Latest Case'],
      ...diseaseData.diseases.map((d: any) => [
        d.disease,
        d.totalCases,
        d.uniquePatients,
        d.affectedHospitals,
        d.trend,
        new Date(d.latestCase).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disease-analytics-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setShowExportMenu(false);
  };

  const handleComprehensiveExport = async () => {
    try {
      setExportingComprehensive(true);
      toast.info('Generating comprehensive export... This may take a moment.');
      
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await axios.get(`/api/analytics/diseases/export?${params}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `disease_analytics_comprehensive_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Comprehensive export downloaded successfully!');
      setShowExportMenu(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export data');
    } finally {
      setExportingComprehensive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Activity className="w-8 h-8" />
            Disease Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track disease patterns, trends, and sample collection across all hospitals
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Privacy Settings
          </Button>
          
          {/* Export Menu */}
          <div className="relative" ref={exportMenuRef}>
            <Button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!diseaseData}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-border shadow-lg z-10">
                <div className="p-2">
                  <button
                    onClick={handleExportData}
                    className="w-full text-left px-4 py-3 hover:bg-muted rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Download className="w-5 h-5 mt-0.5 text-tory-blue" />
                      <div>
                        <div className="font-medium">Quick Summary (CSV)</div>
                        <div className="text-sm text-muted-foreground">
                          Basic disease statistics and trends
                        </div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleComprehensiveExport}
                    disabled={exportingComprehensive}
                    className="w-full text-left px-4 py-3 hover:bg-muted rounded-lg transition-colors mt-1"
                  >
                    <div className="flex items-start gap-3">
                      <FileSpreadsheet className="w-5 h-5 mt-0.5 text-green-haze" />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          Comprehensive Research Export (Excel)
                          <span className="text-xs bg-green-haze/10 text-green-haze px-2 py-0.5 rounded">Recommended</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Anonymized dataset with diagnoses, prescriptions, lab results, vitals, and allergies.
                          Includes 5 sheets with data dictionary.
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                          ⚠️ Patient names & contacts excluded for research privacy
                        </div>
                      </div>
                    </div>
                    {exportingComprehensive && (
                      <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-tory-blue border-t-transparent rounded-full"></div>
                        Generating export...
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Settings Panel */}
      {showSettings && privacySettings && (
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Privacy & Visibility Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <div>
                <p className="font-medium">Disease Analytics</p>
                <p className="text-sm text-muted-foreground">Enable disease tracking and statistics</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.diseaseAnalytics?.enabled ?? true}
                  onChange={(e) => {
                    updatePrivacyMutation.mutate({
                      diseaseAnalytics: {
                        ...privacySettings.diseaseAnalytics,
                        enabled: e.target.checked,
                      },
                      sampleAnalytics: privacySettings.sampleAnalytics,
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <div>
                <p className="font-medium">Show Patient Counts</p>
                <p className="text-sm text-muted-foreground">Display unique patient numbers per disease</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.diseaseAnalytics?.showPatientCount ?? true}
                  onChange={(e) => {
                    updatePrivacyMutation.mutate({
                      diseaseAnalytics: {
                        ...privacySettings.diseaseAnalytics,
                        showPatientCount: e.target.checked,
                      },
                      sampleAnalytics: privacySettings.sampleAnalytics,
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <div>
                <p className="font-medium">Show Hospital Breakdown</p>
                <p className="text-sm text-muted-foreground">Display which hospitals are affected</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.diseaseAnalytics?.showHospitalBreakdown ?? true}
                  onChange={(e) => {
                    updatePrivacyMutation.mutate({
                      diseaseAnalytics: {
                        ...privacySettings.diseaseAnalytics,
                        showHospitalBreakdown: e.target.checked,
                      },
                      sampleAnalytics: privacySettings.sampleAnalytics,
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <div>
                <p className="font-medium">Sample Analytics</p>
                <p className="text-sm text-muted-foreground">Enable lab sample tracking</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.sampleAnalytics?.enabled ?? true}
                  onChange={(e) => {
                    updatePrivacyMutation.mutate({
                      diseaseAnalytics: privacySettings.diseaseAnalytics,
                      sampleAnalytics: {
                        ...privacySettings.sampleAnalytics,
                        enabled: e.target.checked,
                      },
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg border border-border">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <Input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            placeholder="Start Date"
            className="max-w-xs"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            placeholder="End Date"
            className="max-w-xs"
          />
          {(dateRange.startDate || dateRange.endDate) && (
            <Button
              variant="outline"
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              size="sm"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading disease analytics...</p>
          </div>
        </div>
      ) : diseaseData && privacySettings?.diseaseAnalytics?.enabled ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Diseases</p>
                  <p className="text-3xl font-bold text-amaranth mt-1">
                    {diseaseData.summary.totalDiseases}
                  </p>
                </div>
                <Activity className="w-12 h-12 text-amaranth/20" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cases</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {diseaseData.summary.totalCases}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-primary/20" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Patients</p>
                  <p className="text-3xl font-bold text-green-haze mt-1">
                    {diseaseData.summary.totalPatients}
                  </p>
                </div>
                <Users className="w-12 h-12 text-green-haze/20" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Cases/Disease</p>
                  <p className="text-3xl font-bold text-saffron mt-1">
                    {diseaseData.summary.avgCasesPerDisease}
                  </p>
                </div>
                <Building2 className="w-12 h-12 text-saffron/20" />
              </div>
            </div>
          </div>

          {/* Top Diseases */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">Top Diseases</h2>
            <div className="space-y-3">
              {diseaseData.diseases.map((disease: any, index: number) => (
                <div
                  key={disease.disease}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{disease.disease}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        {privacySettings.diseaseAnalytics.showPatientCount && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {disease.uniquePatients} patients
                          </span>
                        )}
                        {privacySettings.diseaseAnalytics.showHospitalBreakdown && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {disease.affectedHospitals} hospitals
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {disease.trend === 'increasing' ? (
                            <TrendingUp className="w-4 h-4 text-red-600" />
                          ) : disease.trend === 'decreasing' ? (
                            <TrendingUp className="w-4 h-4 text-green-600 rotate-180" />
                          ) : (
                            <Activity className="w-4 h-4" />
                          )}
                          {disease.trend}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Latest case: {new Date(disease.latestCase).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amaranth">{disease.totalCases}</p>
                    <p className="text-xs text-muted-foreground">total cases</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Statistics */}
          {diseaseData.samples && privacySettings?.sampleAnalytics?.enabled && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                <TestTube className="w-6 h-6" />
                Sample Collection Statistics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Samples</p>
                  <p className="text-2xl font-bold mt-1">{diseaseData.samples.totalSamples}</p>
                </div>
                <div className="p-4 bg-orange-600/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {diseaseData.samples.pendingSamples}
                  </p>
                </div>
                <div className="p-4 bg-green-haze/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-haze mt-1">
                    {diseaseData.samples.completedSamples}
                  </p>
                </div>
              </div>

              {privacySettings.sampleAnalytics.showDetailedStats && diseaseData.samples.samplesByType?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-3">
                    Breakdown by Test Type
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {diseaseData.samples.samplesByType.map((sample: any) => (
                      <div
                        key={sample.type}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded"
                      >
                        <span className="font-medium">{sample.type}</span>
                        <span className="text-lg font-bold text-primary">{sample.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg border border-border p-12">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Disease Analytics is currently disabled</p>
            <p className="text-sm mt-2">
              Enable it in Privacy Settings to view disease tracking data
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
