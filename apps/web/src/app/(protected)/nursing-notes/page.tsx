'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Plus, FileText, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface NursingNote {
  id: number;
  noteType: string;
  note: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
  };
  nurse: {
    id: number;
    name: string;
  };
  appointment?: {
    id: number;
    startTime: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NursingNotesResponse {
  notes: NursingNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function NursingNotesPage() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  
  // Only nurses and admin can create nursing notes
  const canCreateNote = session?.user?.role === 'admin' || session?.user?.role === 'nurse';

  const { data, isLoading, error } = useQuery<NursingNotesResponse>({
    queryKey: ['nursing-notes', page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await axios.get(`/api/nursing-notes?${params}`);
      return response.data;
    },
  });

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'assessment':
        return 'bg-primary/10 text-primary';
      case 'intervention':
        return 'bg-danube/10 text-danube';
      case 'progress':
        return 'bg-green-haze/10 text-green-haze';
      case 'discharge_planning':
        return 'bg-saffron/10 text-saffron';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nursing Notes</h1>
          <p className="text-muted-foreground mt-1">Document patient care and nursing assessments</p>
        </div>
        {canCreateNote && (
          <Link href="/nursing-notes/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </Link>
        )}
      </div>

      {/* Notes List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading nursing notes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-ribbon">Failed to load nursing notes</p>
          </div>
        ) : data?.notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No nursing notes found</p>
            {canCreateNote && (
              <Link href="/nursing-notes/new">
                <Button variant="primary" size="sm" className="mt-4">
                  Create First Note
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/nursing-notes/${note.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getNoteTypeColor(note.noteType)}`}>
                          {note.noteType.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {note.note}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Patient: {note.patient.firstName} {note.patient.lastName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>By: {note.nurse.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Link
                        href={`/patients/${note.patient.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="sm">
                          <User className="w-4 h-4 mr-2" />
                          View Patient
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total notes)
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
    </div>
  );
}
