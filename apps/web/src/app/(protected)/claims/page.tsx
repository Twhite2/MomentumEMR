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
  hmo?: { id: number; name: string; provider?: string };
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    patientType: string;
  };
  invoiceItems: any[];
  totalAmount: number;
  notes: string | null;
}

export default function ClaimsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [hmoFilter, setHmoFilter] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

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

        return {
          'Invoice Number': `INV-${claim.invoiceId.toString().padStart(6, '0')}`,
          'Patient ID': `P-${claim.patient.id.toString().padStart(6, '0')}`,
          'Patient Name': `${claim.patient.firstName} ${claim.patient.lastName}`,
          'HMO Provider': claim.hmo?.name || 'N/A',
          'HMO Provider Code': claim.hmo?.provider || 'N/A',
          'Status': claim.status.replace('_', ' ').toUpperCase(),
          'Invoice Date': formatDate(claim.submissionDate),
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
            <option value="submitted">Submitted</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="denied">Denied</option>
            <option value="disputed">Disputed</option>
            <option value="outstanding">Outstanding</option>
            <option value="queried">Queried</option>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateModal(claim)}
                      >
                        Update Status
                      </Button>
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
                <option value="submitted">Submitted</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="denied">Denied</option>
                <option value="disputed">Disputed</option>
                <option value="outstanding">Outstanding</option>
                <option value="queried">Queried</option>
              </Select>

              <Input
                label="Approved Amount (₦)"
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder="0.00"
              />

              <Input
                label="Paid Amount (₦)"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />

              {(updateStatus === 'denied' || updateStatus === 'queried') && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {updateStatus === 'denied' ? 'Denial Reason' : 'Query Reason'}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-border rounded-lg resize-none"
                    rows={3}
                    value={denialReason}
                    onChange={(e) => setDenialReason(e.target.value)}
                    placeholder={`Enter ${updateStatus === 'denied' ? 'denial' : 'query'} reason...`}
                  />
                </div>
              )}

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
                loading={updateClaim.isPending}
              >
                Update Claim
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
