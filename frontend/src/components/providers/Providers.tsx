'use client';

import { ReactNode, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { getSocket, initSocket } from '@/lib/socket';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { incrementUnread } = useNotificationStore();

  useEffect(() => {
    if (accessToken && isAuthenticated) {
      const socket = initSocket(accessToken);

      socket.on('notification:new', (notification) => {
        incrementUnread();
      });

      return () => {
        socket.off('notification:new');
      };
    }
  }, [accessToken, isAuthenticated]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
