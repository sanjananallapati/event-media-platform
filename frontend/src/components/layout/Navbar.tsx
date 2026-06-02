'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Menu, X, Camera, LogIn, UserPlus } from 'lucide-react';

export function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
          <Camera className="w-6 h-6" />
          EventMedia
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/events" className="text-secondary-600 hover:text-primary-600 transition-colors">
            Events
          </Link>
          <Link href="/explore" className="text-secondary-600 hover:text-primary-600 transition-colors">
            Explore
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-secondary-600 hover:text-primary-600 transition-colors flex items-center gap-1"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link href="/register" className="btn-primary">
                <UserPlus className="w-4 h-4 mr-1" />
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-secondary-800 border-b"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link
                href="/events"
                className="block py-2 text-secondary-600 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/explore"
                className="block py-2 text-secondary-600 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="btn-primary w-full justify-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block py-2 text-secondary-600 hover:text-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary w-full justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
