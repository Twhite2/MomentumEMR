'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Select } from '@momentum/ui';
import {
  Files,
  Upload,
  Eye,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import FileUpload from '@/components/ui/file-upload';
import FileViewer from '@/components/ui/file-viewer';

interface FileRecord {
  id: number;
  fileName: string;
  fileId: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: string;
  description: string | null;
  createdAt: string;
  uploader: {
    id: number;
    name: string;
    role: string;
  };
}

interface FilesResponse {
  files: FileRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function FilesPage() {
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<FilesResponse>({
    queryKey: ['files', category, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (category) params.append('category', category);

      const response = await axios.get(`/api/upload?${params}`);
      return response.data;
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: number) => {
      await axios.delete(`/api/upload/${fileId}`);
    },
    onSuccess: () => {
      toast.success('File deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: () => {
      toast.error('Failed to delete file');
    },
  });

  const viewFile = async (file: FileRecord) => {
    try {
      const response = await axios.get(`/api/upload/${file.id}`);
      setSelectedFile(response.data);
    } catch (error) {
      toast.error('Failed to load file');
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['files'] });
    setShowUpload(false);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-primary" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-ribbon" />;
    }
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  const getCategoryBadgeColor = (cat: string) => {
    const colors: Record<string, string> = {
      patient_photos: 'bg-primary/10 text-primary',
      lab_results: 'bg-green-haze/10 text-green-haze',
      prescriptions: 'bg-amaranth/10 text-amaranth',
      medical_records: 'bg-danube/10 text-danube',
      invoices: 'bg-saffron/10 text-saffron',
      dicom_images: 'bg-red-ribbon/10 text-red-ribbon',
      documents: 'bg-muted text-muted-foreground',
    };
    return colors[cat] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">File Management</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage medical documents, images, and files
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowUpload(!showUpload)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Upload New File</h2>
          <FileUpload
            category={category || 'documents'}
            onUploadSuccess={handleUploadSuccess}
            multiple
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              <option value="patient_photos">Patient Photos</option>
              <option value="lab_results">Lab Results</option>
              <option value="prescriptions">Prescriptions</option>
              <option value="medical_records">Medical Records</option>
              <option value="invoices">Invoices</option>
              <option value="dicom_images">DICOM Images</option>
              <option value="documents">Documents</option>
            </Select>
          </div>
          {category && (
            <Button
              variant="outline"
              onClick={() => {
                setCategory('');
                setPage(1);
              }}
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading files...</p>
          </div>
        ) : data?.files.length === 0 ? (
          <div className="p-8 text-center">
            <Files className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No files found</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => setShowUpload(true)}
            >
              Upload First File
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium">File</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Uploaded By</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Date</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.files.map((file) => (
                    <tr
                      key={file.id}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.mimeType)}
                          <div>
                            <p className="font-medium text-sm">{file.fileName}</p>
                            {file.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {file.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getCategoryBadgeColor(
                            file.category
                          )}`}
                        >
                          {file.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {formatFileSize(file.fileSize)}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm font-medium">{file.uploader.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {file.uploader.role.replace('_', ' ')}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {formatDateTime(file.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewFile(file)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this file?')) {
                                deleteFile.mutate(file.id);
                              }
                            }}
                            className="text-red-ribbon hover:bg-red-ribbon/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
                  {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}{' '}
                  files
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

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewer file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  );
}

