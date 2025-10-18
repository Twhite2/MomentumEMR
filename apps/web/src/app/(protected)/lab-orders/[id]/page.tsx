'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input, Textarea } from '@momentum/ui';
import { ArrowLeft, TestTube, User, Calendar, Upload, Plus, Trash2, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

interface LabOrder {
  id: number;
  orderType: string;
  status: string;
  description: string | null;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
  };
  doctor: {
    id: number;
    name: string;
    email: string;
  };
  labResults: Array<{
    id: number;
    resultNotes: string | null;
    finalized: boolean;
    releasedToPatient: boolean;
    releasedAt: string | null;
    releaser: { name: string } | null;
    uploader: {
      id: number;
      name: string;
    };
    labResultValues: Array<{
      id: number;
      testName: string;
      resultValue: string | null;
      unit: string | null;
      normalRange: string | null;
    }>;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface TestValue {
  testName: string;
  resultValue: string;
  unit: string;
  normalRange: string;
}

export default function LabOrderDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const orderId = params.id as string;

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [doctorNote, setDoctorNote] = useState('');
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const [resultNotes, setResultNotes] = useState('');
  const [testValues, setTestValues] = useState<TestValue[]>([
    { testName: '', resultValue: '', unit: '', normalRange: '' },
  ]);

  const { data: order, isLoading, error } = useQuery<LabOrder>({
    queryKey: ['lab-order', orderId],
    queryFn: async () => {
      const response = await axios.get(`/api/lab-orders/${orderId}`);
      return response.data;
    },
  });

  // Upload result mutation
  const uploadResult = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`/api/lab-orders/${orderId}/results`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Lab result uploaded successfully!');
      setShowUploadForm(false);
      setResultNotes('');
      setTestValues([{ testName: '', resultValue: '', unit: '', normalRange: '' }]);
      queryClient.invalidateQueries({ queryKey: ['lab-order', orderId] });
    },
    onError: () => {
      toast.error('Failed to upload lab result');
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const response = await axios.put(`/api/lab-orders/${orderId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['lab-order', orderId] });
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Finalize result mutation (lab tech)
  const finalizeResult = useMutation({
    mutationFn: async (resultId: number) => {
      const response = await axios.post(`/api/lab-results/${resultId}/finalize`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Lab result finalized and ready for doctor review!');
      queryClient.invalidateQueries({ queryKey: ['lab-order', orderId] });
    },
    onError: () => {
      toast.error('Failed to finalize result');
    },
  });

  // Release to patient mutation
  const releaseToPatient = useMutation({
    mutationFn: async (resultId: number) => {
      const response = await axios.post(`/api/lab-results/${resultId}/release`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Lab result released to patient!');
      queryClient.invalidateQueries({ queryKey: ['lab-order', orderId] });
    },
    onError: () => {
      toast.error('Failed to release result');
    },
  });

  // Send result with note to patient mutation
  const sendToPatient = useMutation({
    mutationFn: async ({ resultId, note }: { resultId: number; note: string }) => {
      const response = await axios.post(`/api/lab-results/${resultId}/send-to-patient`, {
        doctorNote: note,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Lab result sent to patient with your note!');
      setShowSendDialog(false);
      setDoctorNote('');
      setSelectedResultId(null);
      queryClient.invalidateQueries({ queryKey: ['lab-order', orderId] });
    },
    onError: () => {
      toast.error('Failed to send result to patient');
    },
  });

  const handleOpenSendDialog = () => {
    // Get the latest finalized result
    const finalizedResult = order?.labResults.find(r => r.finalized);
    if (finalizedResult) {
      setSelectedResultId(finalizedResult.id);
      setShowSendDialog(true);
    } else {
      toast.error('No finalized results available to send');
    }
  };

  const handleSendToPatient = () => {
    if (selectedResultId) {
      sendToPatient.mutate({ resultId: selectedResultId, note: doctorNote });
    }
  };

  const addTestValue = () => {
    setTestValues([...testValues, { testName: '', resultValue: '', unit: '', normalRange: '' }]);
  };

  const removeTestValue = (index: number) => {
    if (testValues.length > 1) {
      setTestValues(testValues.filter((_, i) => i !== index));
    }
  };

  const updateTestValue = (index: number, field: keyof TestValue, value: string) => {
    const updated = [...testValues];
    updated[index] = { ...updated[index], [field]: value };
    setTestValues(updated);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validTests = testValues.filter((test) => test.testName.trim() !== '');

    const payload = {
      resultNotes: resultNotes || null,
      testValues: validTests.length > 0 ? validTests : null,
    };

    uploadResult.mutate(payload);
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-saffron text-black';
      case 'in_progress':
        return 'bg-tory-blue text-white';
      case 'completed':
        return 'bg-green-haze text-white';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-tory-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-ribbon mb-4">Failed to load lab order</p>
          <Link href="/lab-orders">
            <Button variant="outline">Back to Lab Orders</Button>
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
          <Link href="/lab-orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Lab Order</h1>
            <p className="text-muted-foreground mt-1">Order #LAB-{order.id.toString().padStart(6, '0')}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(order.status)}`}>
          {order.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Details */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TestTube className="w-5 h-5 text-tory-blue" />
              Test Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Test Type</p>
                <p className="font-medium text-lg">{order.orderType.replace('_', ' ')}</p>
              </div>
              {order.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description & Instructions</p>
                  <div className="p-4 bg-muted/50 border border-border rounded-lg">
                    <p className="whitespace-pre-wrap">{order.description}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Ordered By</p>
                <p className="font-medium">Dr. {order.doctor.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Lab Results */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Lab Results ({order.labResults.length})</h2>
              {order.status !== 'cancelled' && !showUploadForm && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowUploadForm(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Result
                </Button>
              )}
            </div>

            {/* Upload Form */}
            {showUploadForm && (
              <form onSubmit={handleUploadSubmit} className="mb-6 p-4 border border-tory-blue/20 bg-tory-blue/5 rounded-lg">
                <h3 className="font-semibold mb-4">Upload Test Results</h3>
                
                <div className="space-y-4 mb-4">
                  <Textarea
                    label="Result Notes & Summary"
                    value={resultNotes}
                    onChange={(e) => setResultNotes(e.target.value)}
                    rows={4}
                    placeholder="Enter clinical interpretation, summary of findings..."
                  />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Test Values (Optional)</label>
                      <Button type="button" variant="ghost" size="sm" onClick={addTestValue}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Value
                      </Button>
                    </div>

                    {testValues.map((test, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                        <Input
                          placeholder="Test name"
                          value={test.testName}
                          onChange={(e) => updateTestValue(index, 'testName', e.target.value)}
                        />
                        <Input
                          placeholder="Result"
                          value={test.resultValue}
                          onChange={(e) => updateTestValue(index, 'resultValue', e.target.value)}
                        />
                        <Input
                          placeholder="Unit"
                          value={test.unit}
                          onChange={(e) => updateTestValue(index, 'unit', e.target.value)}
                        />
                        <div className="flex gap-1">
                          <Input
                            placeholder="Normal range"
                            value={test.normalRange}
                            onChange={(e) => updateTestValue(index, 'normalRange', e.target.value)}
                          />
                          {testValues.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTestValue(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-ribbon" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={uploadResult.isPending}
                  >
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Results List */}
            {order.labResults.length > 0 ? (
              <div className="space-y-4">
                {order.labResults.map((result) => (
                  <div key={result.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">Result #{result.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded by {result.uploader.name} • {formatDateTime(result.createdAt)}
                        </p>
                        {result.releasedToPatient && result.releasedAt && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Released to patient by {result.releaser?.name} • {formatDateTime(result.releasedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {result.finalized && (
                          <span className="text-xs bg-green-haze text-white px-2 py-1 rounded">
                            Finalized
                          </span>
                        )}
                        {result.releasedToPatient && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            Released
                          </span>
                        )}
                      </div>
                    </div>

                    {result.resultNotes && (
                      <div className="mb-3 p-3 bg-muted/50 rounded">
                        <p className="text-sm whitespace-pre-wrap">{result.resultNotes}</p>
                      </div>
                    )}

                    {result.labResultValues.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Test Values:</p>
                        <div className="space-y-1">
                          {result.labResultValues.map((value) => (
                            <div key={value.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
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

                    {/* Finalize Result Button (Lab Tech) */}
                    {!result.finalized && session?.user?.role === 'lab_tech' && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => finalizeResult.mutate(result.id)}
                          loading={finalizeResult.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Finalize Result
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Mark this result as reviewed and ready for doctor approval
                        </p>
                      </div>
                    )}

                    {/* Release to Patient Button (Doctor) */}
                    {result.finalized && !result.releasedToPatient && ['doctor', 'admin'].includes(session?.user?.role || '') && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => releaseToPatient.mutate(result.id)}
                          loading={releaseToPatient.isPending}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Release to Patient
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          This will make the results visible to the patient
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No results uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Patient</h2>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-16 h-16 bg-tory-blue/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-tory-blue">
                  {order.patient.firstName.charAt(0)}
                  {order.patient.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {order.patient.firstName} {order.patient.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {calculateAge(order.patient.dob)} years • {order.patient.gender}
                </p>
              </div>
            </div>
            <Link href={`/patients/${order.patient.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <User className="w-4 h-4 mr-2" />
                View Patient Profile
              </Button>
            </Link>
          </div>

          {/* Actions */}
          {order.status === 'pending' && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => updateStatus.mutate('in_progress')}
                  loading={updateStatus.isPending}
                >
                  Start Processing
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => updateStatus.mutate('cancelled')}
                >
                  Cancel Order
                </Button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {order.labResults.some(r => r.finalized && !r.releasedToPatient) && (
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={handleOpenSendDialog}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Results to Patient
                </Button>
              )}
              <Link href={`/prescriptions/new?patientId=${order.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Create Prescription
                </Button>
              </Link>
              <Link href={`/appointments/new?patientId=${order.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Schedule Follow-up
                </Button>
              </Link>
              <Link href={`/medical-records/new?patientId=${order.patient.id}`}>
                <Button variant="outline" className="w-full">
                  Add Medical Record
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Send to Patient Dialog */}
      {showSendDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Send Results to Patient</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Add a doctor's note to accompany the lab results
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSendDialog(false);
                  setDoctorNote('');
                  setSelectedResultId(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Patient Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Sending to:</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tory-blue/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-tory-blue">
                      {order.patient.firstName.charAt(0)}{order.patient.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {order.patient.firstName} {order.patient.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {calculateAge(order.patient.dob)} years • {order.patient.gender}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Info */}
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm font-medium mb-2">Test Type:</p>
                <p className="text-lg font-semibold">{order.orderType.replace('_', ' ')}</p>
              </div>

              {/* Doctor's Note */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Doctor's Note <span className="text-red-ribbon">*</span>
                </label>
                <Textarea
                  value={doctorNote}
                  onChange={(e) => setDoctorNote(e.target.value)}
                  rows={6}
                  placeholder="Write a note to the patient explaining the results, next steps, or any recommendations...

Example:
Your test results are within normal ranges. Please continue with your current treatment plan. If you experience any symptoms, schedule a follow-up appointment."
                  className="w-full"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This note will be visible to the patient along with their lab results
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSendToPatient}
                  loading={sendToPatient.isPending}
                  disabled={!doctorNote.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to Patient
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSendDialog(false);
                    setDoctorNote('');
                    setSelectedResultId(null);
                  }}
                  disabled={sendToPatient.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
