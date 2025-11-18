'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface ExcelImportExportProps {
  title: string;
  description: string;
  templateEndpoint: string;
  importEndpoint: string;
  templateFilename: string;
  queryKey: string[];
  onSuccess?: (data: any) => void;
}

export default function ExcelImportExport({
  title,
  description,
  templateEndpoint,
  importEndpoint,
  templateFilename,
  queryKey,
  onSuccess,
}: ExcelImportExportProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Excel template
  const handleDownloadTemplate = async () => {
    try {
      toast.info('Downloading template...');
      const response = await axios.get(templateEndpoint, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${templateFilename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to download template');
    }
  };

  // Upload Excel file mutation
  const uploadExcelMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(importEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });

      if (data.imported > 0) {
        toast.success(
          `✅ Successfully imported ${data.imported} record(s)!`,
          { duration: 5000 }
        );
      }

      if (data.failed > 0) {
        toast.warning(
          `⚠️ ${data.failed} record(s) failed. Check console for details.`,
          { duration: 8000 }
        );
        console.log('Import errors:', data.errors);
      }

      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to import records');
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    toast.info('Processing Excel file...');
    uploadExcelMutation.mutate(file);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-blue-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={handleDownloadTemplate}
            className="border-blue-300 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id={`excel-upload-${templateFilename}`}
              disabled={uploading}
            />
            <label htmlFor={`excel-upload-${templateFilename}`} className="cursor-pointer">
              <span
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-tory-blue hover:bg-tory-blue/90 text-white cursor-pointer'
                }`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Excel'}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
