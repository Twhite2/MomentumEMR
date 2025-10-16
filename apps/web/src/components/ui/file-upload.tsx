'use client';

import { useState, useRef } from 'react';
import { Button } from '@momentum/ui';
import { Upload, X, File, Image, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  category: string;
  relatedId?: number;
  relatedType?: string;
  onUploadSuccess?: (file: any) => void;
  maxSize?: number; // in MB
  accept?: string;
  multiple?: boolean;
}

export default function FileUpload({
  category,
  relatedId,
  relatedType,
  onUploadSuccess,
  maxSize = 10,
  accept,
  multiple = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    const invalidFiles = files.filter((file) => file.size > maxSizeBytes);

    if (invalidFiles.length > 0) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    setSelectedFiles(multiple ? [...selectedFiles, ...files] : files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        if (relatedId) formData.append('relatedId', relatedId.toString());
        if (relatedType) formData.append('relatedType', relatedType);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        return response.json();
      });

      const results = await Promise.all(uploadPromises);

      toast.success(
        `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} uploaded successfully!`
      );

      setSelectedFiles([]);

      if (onUploadSuccess) {
        results.forEach((result) => onUploadSuccess(result));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (file.type === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />

        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm font-medium mb-1">
          Drag and drop your file{multiple ? 's' : ''} here
        </p>
        <p className="text-sm text-muted-foreground mb-4">or</p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          Browse Files
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Maximum file size: {maxSize}MB
        </p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Files:</p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-background rounded"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <Button
          variant="primary"
          onClick={uploadFiles}
          loading={uploading}
          disabled={uploading}
          className="w-full"
          type="button"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
        </Button>
      )}

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Files are securely stored and can only be accessed by authorized personnel. Supported
          formats vary by category.
        </p>
      </div>
    </div>
  );
}

