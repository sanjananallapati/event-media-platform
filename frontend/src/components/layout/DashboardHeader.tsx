'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Bell, Shield } from 'lucide-react';

const pathLabels: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/events': 'Events',
  '/dashboard/search': 'Search',
  '/dashboard/favourites': 'Favourites',
  '/dashboard/face-search': 'My Photos',
  '/dashboard/profile': 'Profile',
  '/dashboard/upload': 'Upload Media',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/admin': 'Admin Panel',
  '/dashboard/role-request': 'Role Request',
};

export function DashboardHeader() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const label =
    Object.entries(pathLabels).find(([k]) => pathname === k)?.[1] ||
    Object.entries(pathLabels).find(([k]) => pathname.startsWith(k) && k !== '/dashboard')?.[1] ||
    'Dashboard';

  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#1e1e2e] px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-semibold text-base">{label}</h1>
        <div className="flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-1.5 text-xs font-medium text-violet-400 bg-violet-600/10 border border-violet-500/20 px-3 py-1.5 rounded-lg hover:bg-violet-600/20 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Panel
            </Link>
          )}
          <Link
            href="/dashboard/notifications"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Bell className="w-5 h-5" />
          </Link>
          <Link href="/dashboard/profile">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName || user.username}
                className="w-9 h-9 rounded-xl object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white text-sm font-bold">
                {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
