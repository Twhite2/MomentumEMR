'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@momentum/ui';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', filter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filter === 'unread') params.append('unreadOnly', 'true');

      const response = await axios.get(`/api/notifications?${params}`);
      return response.data;
    },
  });

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      await axios.patch(`/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await axios.post('/api/notifications/mark-read', { markAllAsRead: true });
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: number) => {
      await axios.delete(`/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      toast.success('Notification deleted');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
      case 'appointment_confirmed':
        return '📅';
      case 'appointment_cancelled':
        return '❌';
      case 'prescription_ready':
        return '💊';
      case 'lab_result_ready':
        return '🔬';
      case 'invoice_generated':
        return '📄';
      case 'payment_received':
        return '💰';
      case 'low_stock_alert':
        return '⚠️';
      case 'medication_expiring':
        return '⏰';
      case 'medication_expired':
        return '🚫';
      default:
        return '🔔';
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with important events and alerts
          </p>
        </div>
        {data && data.unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            loading={markAllAsRead.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Notifications</p>
            <p className="text-2xl font-bold">{data.pagination.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Unread</p>
            <p className="text-2xl font-bold text-tory-blue">{data.unreadCount}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="md"
            onClick={() => {
              setFilter('all');
              setPage(1);
            }}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'outline'}
            size="md"
            onClick={() => {
              setFilter('unread');
              setPage(1);
            }}
          >
            Unread {data && data.unreadCount > 0 && `(${data.unreadCount})`}
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-tory-blue border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading notifications...</p>
          </div>
        ) : data?.notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-muted/30 transition-colors ${
                    !notification.read ? 'bg-tory-blue/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{notification.title}</h3>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-tory-blue rounded-full"></span>
                            )}
                          </div>
                          <p className="text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {formatDateTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead.mutate(notification.id);
                              }
                            }}
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        )}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead.mutate(notification.id)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark as Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification.mutate(notification.id)}
                          className="text-red-ribbon hover:bg-red-ribbon/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to{' '}
                  {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}{' '}
                  notifications
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
