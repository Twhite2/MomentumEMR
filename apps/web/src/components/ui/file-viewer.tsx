'use client';

import { useState } from 'react';
import { Button } from '@momentum/ui';
import { X, Download, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';

interface FileViewerProps {
  file: {
    id: number;
    fileName: string;
    fileUrl: string;
    signedUrl?: string;
    mimeType: string;
    fileSize: number;
  };
  onClose: () => void;
}

export default function FileViewer({ file, onClose }: FileViewerProps) {
  const [loading, setLoading] = useState(true);
  const displayUrl = file.signedUrl || file.fileUrl;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(displayUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const renderViewer = () => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4">
          <img
            src={displayUrl}
            alt={file.fileName}
            className="max-w-full max-h-[600px] object-contain"
            onLoad={() => setLoading(false)}
          />
        </div>
      );
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <iframe
          src={displayUrl}
          className="w-full h-[600px] rounded-lg border border-border"
          onLoad={() => setLoading(false)}
        />
      );
    }

    // For other file types, show download option
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-lg">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">{file.fileName}</p>
        <p className="text-sm text-muted-foreground mb-6">
          Preview not available for this file type
        </p>
        <Button variant="primary" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{file.fileName}</h2>
            <p className="text-sm text-muted-foreground">
              {file.mimeType} • {formatFileSize(file.fileSize)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={onClose} title="Close">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          <div className={loading ? 'hidden' : ''}>{renderViewer()}</div>
        </div>
      </div>
    </div>
  );
}

