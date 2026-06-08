'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import {
  Camera,
  Calendar,
  Heart,
  Download,
  Users,
  TrendingUp,
  Eye,
  Shield,
  Upload,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/me')
      .then((r) => setAnalytics(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'My Uploads', value: analytics?.stats?.uploads ?? 0, icon: Camera, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Likes Received', value: analytics?.stats?.receivedLikes ?? 0, icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Comments', value: analytics?.stats?.receivedComments ?? 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'Downloads', value: analytics?.stats?.downloads ?? 0, icon: Download, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    
  ];

  const quickActions = [
    { href: '/dashboard/events', icon: Calendar, label: 'Browse Events', color: 'text-green-400' },
    { href: '/dashboard/face-search', icon: Users, label: 'Find My Photos', color: 'text-purple-400' },
    { href: '/dashboard/favourites', icon: Heart, label: 'Favourites', color: 'text-red-400' },
    ...(user?.role === 'VIEWER'
      ? [{ href: '/dashboard/role-request', icon: Shield, label: 'Request Role', color: 'text-violet-400' }]
      : [{ href: '/dashboard/upload', icon: Upload, label: 'Upload Media', color: 'text-blue-400' }]),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.fullName?.split(' ')[0] || user?.username}! 👋
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Here's an overview of your activity on the platform.
        </p>
        {user?.role === 'VIEWER' && (
          <Link
            href="/dashboard/role-request"
            className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-violet-400 bg-violet-600/10 border border-violet-500/20 px-3 py-1.5 rounded-lg hover:bg-violet-600/20 transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            Request a role upgrade to unlock more features
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5 space-y-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} border flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#2a2a3a] hover:border-violet-500/50 hover:bg-violet-600/5 transition-all group"
            >
              <Icon className={`w-7 h-7 ${color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Uploads */}
      {analytics?.recentUploads?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Recent Uploads</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {analytics.recentUploads.slice(0, 5).map((media: any) => (
              <Link
                key={media.id}
                href={`/dashboard/media/${media.id}`}
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#1a1a25]"
              >
                <img
                  src={media.thumbnailUrl || media.url}
                  alt={media.caption || media.originalName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end p-2">
                  <div className="flex gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {media._count?.likes ?? 0}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {media.viewCount ?? 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
