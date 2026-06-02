'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { api } from '@/lib/api';
import { Bell, Search, User, Moon, Sun } from 'lucide-react';

export function DashboardHeader() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    // Check system preference
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(isDark);
    }
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications', { params: { unreadOnly: true, limit: 1 } });
      setUnreadCount(response.data.data.unreadCount);
    } catch {}
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-secondary-800 border-b px-4 lg:px-6 h-16 flex items-center gap-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md ml-12 lg:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary-100 dark:bg-secondary-700 border-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      </form>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700"
        >
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 object-cover" />
            ) : (
              <User className="w-4 h-4 text-primary-600" />
            )}
          </div>
          <span className="hidden sm:block text-sm font-medium">{user?.fullName}</span>
        </Link>
      </div>
    </header>
  );
}
