'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  // Three states: 'checking' | 'authenticated' | 'unauthenticated'
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  useEffect(() => {
    const verify = async () => {
      try {
        await checkAuth();
        // After checkAuth, read the fresh store state
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

    // If already authenticated (e.g. persisted token was valid), skip checkAuth
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
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <DashboardHeader />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
