'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useNotificationStore } from '@/store/notification.store';
import { Bell, Heart, MessageCircle, Tag, Upload, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';

const iconMap: Record<string, React.ElementType> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  TAG: Tag,
  UPLOAD: Upload,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { unreadCount, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!notification?.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-secondary-500">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary text-sm">
            <Check className="w-4 h-4 mr-1" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-12 text-center"
        >
          <Bell className="w-12 h-12 mx-auto text-secondary-400 mb-4" />
          <h3 className="text-lg font-medium">No notifications</h3>
          <p className="text-secondary-500 mt-1">You're all caught up!</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification, index) => {
            const Icon = iconMap[notification.type] || Bell;
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`card p-4 flex items-start gap-3 ${
                  !notification.isRead ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notification.type === 'LIKE'
                      ? 'bg-red-100 text-red-500'
                      : notification.type === 'COMMENT'
                      ? 'bg-blue-100 text-blue-500'
                      : notification.type === 'TAG'
                      ? 'bg-purple-100 text-purple-500'
                      : 'bg-green-100 text-green-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {notification.sender && (
                      <span className="font-medium">{notification.sender.fullName || notification.sender.username}</span>
                    )}{' '}
                    {notification.message}
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">
                    {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                  {notification.mediaId && (
                    <Link
                      href={`/dashboard/media/${notification.mediaId}`}
                      className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                    >
                      View media
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
