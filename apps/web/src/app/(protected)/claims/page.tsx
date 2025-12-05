'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select } from '@momentum/ui';
import { FileText, Filter, Download, DollarSign, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface Claim {
  id: number;
  invoiceId: number;
  status: string;
  submittedAmount: number;
  paidAmount: number | null;
  submissionDate: string;
  hmoId: number | null;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    patientType: string;
    hmo: {
      id: number;
      name: string;
      provider: string | null;
    } | null;
  };
  hmo: {
    id: number;
    name: string;
    provider: string | null;
  } | null;
  invoiceItems: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  totalAmount: number;
  notes: string | null;
  // Visit information
  prescriptions?: Array<{
    id: number;
    doctor: { id: number; name: string };
    prescriptionItems: Array<{
      drugName: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      durationUnit?: string;
    }>;
  }>;
  medicalRecords?: Array<{
    id: number;
    diagnosis?: string;
    notes?: string;
    doctor: { id: number; name: string };
  }>;
  labOrders?: Array<{
    id: number;
    orderType: string;
    description?: string;
    status?: string;
    doctor: { id: number; name: string };
  }>;
}

export default function ClaimsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [hmoFilter, setHmoFilter] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedClaimId, setExpandedClaimId] = useState<number | null>(null);

  // Update form state
  const [updateStatus, setUpdateStatus] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch claims
  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['claims', statusFilter, hmoFilter],
    queryFn: async () => {
      let url = '/api/claims?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (hmoFilter) url += `hmoId=${hmoFilter}&`;
      const response = await axios.get(url);
      return response.data;
    },
  });

  // Fetch HMOs for filter
  const { data: hmosData } = useQuery({
    queryKey: ['hmos-list'],
    queryFn: async () => {
      const response = await axios.get('/api/hmo');
      return { hmos: response.data }; // Wrap in object for consistent access
    },
  });

  // Update claim mutation
  const updateClaim = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.patch(`/api/claims/${selectedClaim?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Claim updated successfully');
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setShowUpdateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update claim');
    },
  });

  const resetForm = () => {
    setUpdateStatus('');
    setApprovedAmount('');
    setPaidAmount('');
    setDenialReason('');
    setNotes('');
    setSelectedClaim(null);
  };

  const handleUpdateClaim = () => {
    const data: any = {
      notes,
    };

    if (updateStatus) data.status = updateStatus;
    if (approvedAmount) data.approvedAmount = parseFloat(approvedAmount);
    if (paidAmount) data.paidAmount = parseFloat(paidAmount);
    if (denialReason) data.denialReason = denialReason;

    updateClaim.mutate(data);
  };

  const openUpdateModal = (claim: Claim) => {
    setSelectedClaim(claim);
    setUpdateStatus(claim.status);
    setApprovedAmount('');
    setPaidAmount(claim.paidAmount?.toString() || '');
    setShowUpdateModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-haze/10 text-green-haze border-green-haze';
      case 'denied':
        return 'bg-red-ribbon/10 text-red-ribbon border-red-ribbon';
      case 'disputed':
        return 'bg-saffron/10 text-saffron border-saffron';
      case 'outstanding':
        return 'bg-danube/10 text-danube border-danube';
      case 'submitted':
        return 'bg-tory-blue/10 text-tory-blue border-tory-blue';
      case 'queried':
        return 'bg-purple-600/10 text-purple-600 border-purple-600';
      default:
        return 'bg-spindle text-primary border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'denied':
        return <XCircle className="w-4 h-4" />;
      case 'disputed':
      case 'queried':
        return <AlertTriangle className="w-4 h-4" />;
      case 'outstanding':
      case 'submitted':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Export claims to Excel
  const exportToExcel = () => {
    if (!claimsData?.claims || claimsData.claims.length === 0) {
      toast.error('No claims to export');
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = claimsData.claims.map((claim: Claim) => {
        // Format invoice items details
        const itemsDetails = claim.invoiceItems.map((item: any, index: number) => 
          `${index + 1}. ${item.description} (Qty: ${item.quantity}) - ${formatCurrency(Number(item.amount))}`
        ).join('\n');

        // Format diagnosis from medical records
        const diagnosis = claim.medicalRecords && claim.medicalRecords.length > 0
          ? claim.medicalRecords[0].diagnosis || 'N/A'
          : 'N/A';

        // Format clinical notes from medical records
        const clinicalNotes = claim.medicalRecords && claim.medicalRecords.length > 0
          ? claim.medicalRecords[0].notes || 'N/A'
          : 'N/A';

        // Format prescriptions
        const prescriptionsDetails = claim.prescriptions && claim.prescriptions.length > 0
          ? claim.prescriptions.map((rx: any) =>
              rx.prescriptionItems.map((item: any) =>
                `${item.drugName} - ${item.dosage || ''} ${item.frequency || ''} for ${item.duration || ''} ${item.durationUnit || ''}`
              ).join('; ')
            ).join('\n')
          : 'N/A';

        // Format lab orders
        const labOrdersDetails = claim.labOrders && claim.labOrders.length > 0
          ? claim.labOrders.map((order: any, index: number) =>
              `${index + 1}. ${order.orderType} - ${order.description || ''} (Status: ${order.status || 'N/A'})`
            ).join('\n')
          : 'N/A';

        return {
          'Invoice Number': `INV-${claim.invoiceId.toString().padStart(6, '0')}`,
          'Patient ID': `P-${claim.patient.id.toString().padStart(6, '0')}`,
          'Patient Name': `${claim.patient.firstName} ${claim.patient.lastName}`,
          'HMO Provider': claim.hmo?.name || 'N/A',
          'HMO Provider Code': claim.hmo?.provider || 'N/A',
          'Status': claim.status.replace('_', ' ').toUpperCase(),
          'Invoice Date': formatDate(claim.submissionDate),
          'Diagnosis': diagnosis,
          'Clinical Notes': clinicalNotes,
          'Prescriptions': prescriptionsDetails,
          'Lab Orders': labOrdersDetails,
          'Total Amount (NGN)': Number(claim.submittedAmount),
          'Amount Paid (NGN)': Number(claim.paidAmount) || 0,
          'Balance (NGN)': Number(claim.submittedAmount) - (Number(claim.paidAmount) || 0),
          'Number of Items': claim.invoiceItems.length,
          'Invoice Items': itemsDetails,
          'Notes': claim.notes || '',
        };
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Invoice Number
        { wch: 12 }, // Patient ID
        { wch: 25 }, // Patient Name
        { wch: 20 }, // HMO Provider
        { wch: 20 }, // HMO Provider Code
        { wch: 15 }, // Status
        { wch: 15 }, // Invoice Date
        { wch: 40 }, // Diagnosis
        { wch: 50 }, // Clinical Notes
        { wch: 60 }, // Prescriptions
        { wch: 40 }, // Lab Orders
        { wch: 18 }, // Total Amount
        { wch: 18 }, // Amount Paid
        { wch: 18 }, // Balance
        { wch: 15 }, // Number of Items
        { wch: 50 }, // Invoice Items
        { wch: 30 }, // Notes
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'HMO Claims');

      // Generate filename with date and filters
      const date = new Date().toISOString().split('T')[0];
      let filename = `HMO_Claims_${date}`;
      
      if (hmoFilter) {
        const selectedHMO = hmosData?.hmos?.find((h: any) => h.id.toString() === hmoFilter);
        if (selectedHMO) {
          filename += `_${selectedHMO.name.replace(/\s+/g, '_')}`;
        }
      }
      
      if (statusFilter) {
        filename += `_${statusFilter}`;
      }
      
      filename += '.xlsx';

      // Download file
      XLSX.writeFile(workbook, filename);
      toast.success('Claims exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export claims');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Claims Management</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage HMO claims submissions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </Select>

          <Select
            label="HMO"
            value={hmoFilter}
            onChange={(e) => setHmoFilter(e.target.value)}
          >
            <option value="">All HMOs</option>
            {hmosData?.hmos?.map((hmo: any) => (
              <option key={hmo.id} value={hmo.id}>
                {hmo.name}
              </option>
            ))}
          </Select>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setHmoFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Claims ({claimsData?.pagination?.total || 0})
            </h2>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToExcel}
                disabled={!claimsData?.claims || claimsData.claims.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
              <Link href="/claims/analytics">
                <Button variant="outline" size="sm">
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading claims...</p>
          </div>
        ) : claimsData?.claims?.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-sm text-muted-foreground">No claims found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-spindle/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    HMO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {claimsData?.claims?.map((claim: Claim) => (
                  <tr key={claim.id} className="hover:bg-spindle/20">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">INV-{claim.invoiceId.toString().padStart(6, '0')}</div>
                      <div className="text-xs text-muted-foreground">
                        {claim.invoiceItems.length} item(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{claim.patient.firstName} {claim.patient.lastName}</div>
                      <div className="text-xs text-muted-foreground">ID: P-{claim.patient.id.toString().padStart(6, '0')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{claim.hmo?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(claim.status)}`}>
                        {getStatusIcon(claim.status)}
                        {claim.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(claim.submittedAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(claim.paidAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(claim.submissionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClaim(claim);
                            setShowDetailsModal(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUpdateModal(claim)}
                        >
                          Update Status
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Update Claim Status</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Invoice: INV-{selectedClaim.invoiceId.toString().padStart(6, '0')} • {selectedClaim.patient.firstName} {selectedClaim.patient.lastName} • {selectedClaim.hmo?.name || 'N/A'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <Select
                label="Status"
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </Select>

              <Input
                label="Paid Amount (₦)"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg resize-none"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpdateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateClaim}
                disabled={updateClaim.isPending}
              >
                {updateClaim.isPending ? 'Updating...' : 'Update Claim'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Details Modal */}
      {showDetailsModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-border sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Claim Details</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invoice: INV-{selectedClaim.invoiceId.toString().padStart(6, '0')} • {selectedClaim.patient.firstName} {selectedClaim.patient.lastName}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient & Billing Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm mb-3">Patient Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Patient ID:</span>
                      <span className="font-medium">P-{selectedClaim.patient.id.toString().padStart(6, '0')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedClaim.patient.firstName} {selectedClaim.patient.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Patient Type:</span>
                      <span className="font-medium capitalize">{selectedClaim.patient.patientType?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">HMO:</span>
                      <span className="font-medium">{selectedClaim.hmo?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-3">Billing Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedClaim.submittedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="font-medium text-green-haze">{formatCurrency(selectedClaim.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(selectedClaim.submittedAmount - (selectedClaim.paidAmount || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(selectedClaim.status)}`}>
                        {getStatusIcon(selectedClaim.status)}
                        {selectedClaim.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Information */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Clinical Information</h4>
                
                {/* Diagnosis */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Diagnosis</h5>
                  {selectedClaim.medicalRecords && selectedClaim.medicalRecords.length > 0 ? (
                    <div className="bg-spindle/30 p-4 rounded-lg">
                      <p className="text-sm">{selectedClaim.medicalRecords[0].diagnosis || 'No diagnosis recorded'}</p>
                      {selectedClaim.medicalRecords[0].doctor && (
                        <p className="text-xs text-muted-foreground mt-2">
                          By: {selectedClaim.medicalRecords[0].doctor.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No diagnosis recorded for this visit</p>
                  )}
                </div>

                {/* Clinical Notes */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Clinical Notes</h5>
                  {selectedClaim.medicalRecords && selectedClaim.medicalRecords.length > 0 && selectedClaim.medicalRecords[0].notes ? (
                    <div className="bg-spindle/30 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedClaim.medicalRecords[0].notes}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No clinical notes recorded for this visit</p>
                  )}
                </div>

                {/* Prescriptions */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Prescriptions</h5>
                  {selectedClaim.prescriptions && selectedClaim.prescriptions.length > 0 ? (
                    <div className="space-y-3">
                      {selectedClaim.prescriptions.map((rx, idx) => (
                        <div key={rx.id} className="bg-spindle/30 p-4 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Prescription #{idx + 1} - Dr. {rx.doctor.name}</p>
                          <div className="space-y-2">
                            {rx.prescriptionItems.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.drugName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.dosage} • {item.frequency} • {item.duration} {item.durationUnit}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No prescriptions for this visit</p>
                  )}
                </div>

                {/* Lab Orders */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Lab Orders</h5>
                  {selectedClaim.labOrders && selectedClaim.labOrders.length > 0 ? (
                    <div className="space-y-2">
                      {selectedClaim.labOrders.map((order, idx) => (
                        <div key={order.id} className="bg-spindle/30 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{order.orderType}</p>
                              {order.description && (
                                <p className="text-xs text-muted-foreground mt-1">{order.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">Ordered by: Dr. {order.doctor.name}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'completed' ? 'bg-green-haze/10 text-green-haze' :
                              order.status === 'pending' ? 'bg-orange-600/10 text-orange-600' :
                              'bg-gray-500/10 text-gray-500'
                            }`}>
                              {order.status || 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No lab orders for this visit</p>
                  )}
                </div>
              </div>

              {/* Invoice Items */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Invoice Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-spindle/30">
                      <tr>
                        <th className="px-4 py-2 text-left">#</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedClaim.invoiceItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2">{idx + 1}</td>
                          <td className="px-4 py-2">{item.description}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(Number(item.amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border sticky bottom-0 bg-white flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
