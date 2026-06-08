'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import clsx from 'clsx';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Restore sidebar preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  const handleToggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  useEffect(() => {
    const verify = async () => {
      try {
        await checkAuth();
        const state = useAuthStore.getState();
        if (state.isAuthenticated) {
          setAuthState('authenticated');
        } else {
          setAuthState('unauthenticated');
          router.replace('/login');
        }
      } catch {
        setAuthState('unauthenticated');
        router.replace('/login');
      }
    };

    if (isAuthenticated) {
      setAuthState('authenticated');
    } else {
      verify();
    }
  }, []); // Run only once on mount

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] gap-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0f]">
      <DashboardSidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      {/* Main content — margin mirrors sidebar width and animates in sync */}
      <div
        className={clsx(
          'flex-1 flex flex-col min-h-screen transition-[margin-left] duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64'
        )}
      >
        <DashboardHeader />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
