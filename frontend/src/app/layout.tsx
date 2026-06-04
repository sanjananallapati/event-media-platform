import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'EventMedia - AI-Powered Event Media Platform',
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
      <body className={`${dmSans.variable} ${syne.variable} font-sans bg-[#0A0A0F] text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}