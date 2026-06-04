'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import {
  Camera,
  Home,
  Calendar,
  Search,
  Heart,
  User,
  LogOut,
  Users,
  Shield,
  PlusCircle,
  Upload,
  Menu,
  X,
  Bell,
  Scan,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home', exact: true },
  { href: '/dashboard/events', icon: Calendar, label: 'Events' },
  { href: '/dashboard/search', icon: Search, label: 'Search' },
  { href: '/dashboard/favourites', icon: Heart, label: 'Favourites' },
  { href: '/dashboard/face-search', icon: Scan, label: 'My Photos' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

const userActionItems = [
  { href: '/dashboard/role-request', icon: Shield, label: 'Request Role', roles: ['VIEWER'] },
];

const adminActions = [
  { href: '/dashboard/admin', icon: Shield, label: 'Admin Panel' },
  { href: '/dashboard/events', icon: PlusCircle, label: 'New Event' },
  { href: '/dashboard/upload', icon: Upload, label: 'Upload Media' },
];

function NavLink({
  href,
  icon: Icon,
  label,
  exact = false,
  onClick,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  onClick?: () => void;
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group',
        isActive
          ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
          : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'
      )}
    >
      <Icon className={clsx('w-5 h-5 shrink-0', isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300')} />
      <span>{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto bg-violet-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

function UserChip({ user }: { user: any }) {
  const initials = (user.fullName || user.username || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleColors: Record<string, string> = {
    ADMIN: 'text-red-400',
    PHOTOGRAPHER: 'text-blue-400',
    CLUB_MEMBER: 'text-green-400',
    VIEWER: 'text-gray-400',
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      {user.avatar ? (
        <img src={user.avatar} alt={user.fullName} className="w-9 h-9 rounded-full object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {initials}
        </div>
      )}
      <div className="overflow-hidden">
        <p className="text-sm font-semibold text-white truncate">{user.fullName || user.username}</p>
        <p className={clsx('text-xs font-medium', roleColors[user.role] || 'text-gray-400')}>
          {user.role?.charAt(0) + user.role?.slice(1).toLowerCase().replace('_', ' ')}
        </p>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    router.push('/');
  };

  const close = () => setMobileOpen(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0d0d14] border-r border-[#1e1e2e]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1e1e2e]">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <Camera className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-base tracking-tight">CIG Media</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onClick={close} />
        ))}

        {/* Viewer: role request */}
        {user?.role === 'VIEWER' && (
          <>
            <div className="pt-3 pb-1 px-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Upgrade</p>
            </div>
            <NavLink href="/dashboard/role-request" icon={Shield} label="Request Role" onClick={close} />
          </>
        )}

        {/* Admin actions */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="pt-3 pb-1 px-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Actions</p>
            </div>
            {adminActions.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} onClick={close} />
            ))}
          </>
        )}

        {/* Photographers/Members: upload */}
        {(user?.role === 'PHOTOGRAPHER' || user?.role === 'CLUB_MEMBER') && (
          <>
            <div className="pt-3 pb-1 px-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Actions</p>
            </div>
            <NavLink href="/dashboard/upload" icon={Upload} label="Upload Media" onClick={close} />
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-[#1e1e2e] px-3 py-3 space-y-1">
        {user && <UserChip user={user} />}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:text-red-400 transition-colors" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0d0d14] border border-[#1e1e2e] rounded-xl shadow-lg"
      >
        <Menu className="w-5 h-5 text-gray-400" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="lg:hidden fixed inset-0 bg-black/70 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50"
            >
              <SidebarContent />
              <button
                onClick={close}
                className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
