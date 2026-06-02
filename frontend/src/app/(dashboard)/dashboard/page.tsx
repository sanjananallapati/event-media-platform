'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import {
  Camera,
  Calendar,
  Heart,
  Download,
  Image as ImageIcon,
  Users,
  TrendingUp,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/me');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'My Uploads',
      value: analytics?.stats?.uploads || 0,
      icon: Camera,
      color: 'bg-blue-500',
    },
    {
      label: 'Likes Received',
      value: analytics?.stats?.receivedLikes || 0,
      icon: Heart,
      color: 'bg-red-500',
    },
    {
      label: 'Comments',
      value: analytics?.stats?.receivedComments || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'Downloads',
      value: analytics?.stats?.downloads || 0,
      icon: Download,
      color: 'bg-purple-500',
    },
    {
      label: 'Face Matches',
      value: analytics?.stats?.faceMatches || 0,
      icon: Users,
      color: 'bg-amber-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.fullName || user?.username}! 👋
        </h1>
        <p className="text-secondary-500 mt-1">
          Here's an overview of your activity on the platform.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-secondary-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/dashboard/upload"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-secondary-300 dark:border-secondary-600 hover:border-primary-500 transition-colors"
          >
            <Camera className="w-8 h-8 text-primary-500" />
            <span className="text-sm font-medium">Upload Media</span>
          </Link>
          <Link
            href="/dashboard/events"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-secondary-300 dark:border-secondary-600 hover:border-primary-500 transition-colors"
          >
            <Calendar className="w-8 h-8 text-green-500" />
            <span className="text-sm font-medium">Browse Events</span>
          </Link>
          <Link
            href="/dashboard/face-search"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-secondary-300 dark:border-secondary-600 hover:border-primary-500 transition-colors"
          >
            <Users className="w-8 h-8 text-purple-500" />
            <span className="text-sm font-medium">Find My Photos</span>
          </Link>
          <Link
            href="/dashboard/favourites"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-secondary-300 dark:border-secondary-600 hover:border-primary-500 transition-colors"
          >
            <Heart className="w-8 h-8 text-red-500" />
            <span className="text-sm font-medium">Favourites</span>
          </Link>
        </div>
      </motion.div>

      {/* Recent Uploads */}
      {analytics?.recentUploads && analytics.recentUploads.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {analytics.recentUploads.slice(0, 5).map((media: any) => (
              <Link
                key={media.id}
                href={`/dashboard/media/${media.id}`}
                className="group relative aspect-square rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-700"
              >
                <img
                  src={media.thumbnailUrl || media.url}
                  alt={media.caption || media.originalName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2">
                  <div className="flex gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {media._count?.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {media.viewCount || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
