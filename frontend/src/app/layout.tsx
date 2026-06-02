import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EventMedia - Event & Media Management Platform',
  description: 'Centralized event media management for clubs and societies',
  keywords: ['events', 'media', 'photography', 'clubs', 'societies'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
