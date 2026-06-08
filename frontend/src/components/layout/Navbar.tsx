'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Menu, X, Camera, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const { isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-[#27272A]/80 shadow-[0_1px_0_rgba(255,255,255,0.03)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
            <Camera className="w-4 h-4 text-violet-400" />
          </div>
          <span className="font-semibold text-lg text-white tracking-tight font-display">
            Event<span className="text-violet-400">Media</span>
          </span>
        </Link>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard" className="btn-primary">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all duration-200">
                <LogIn className="w-3.5 h-3.5" />
                Login
              </Link>
              <Link href="/register" className="btn-primary">
                <UserPlus className="w-3.5 h-3.5" />
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-[#3f3f46] transition-all"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden overflow-hidden bg-[#0D1117]/95 backdrop-blur-xl border-b border-[#27272A]"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 space-y-2">
              {isAuthenticated ? (
                <Link href="/dashboard" className="btn-primary w-full" onClick={() => setMobileMenuOpen(false)}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary w-full" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                  <Link href="/register" className="btn-primary w-full" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}