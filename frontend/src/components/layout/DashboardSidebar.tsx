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
  Shield,
  PlusCircle,
  Upload,
  Menu,
  X,
  Scan,
  GalleryVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home', exact: true },
  { href: '/dashboard/gallery', icon: GalleryVertical, label: 'Gallery' },
  { href: '/dashboard/events', icon: Calendar, label: 'Events' },
  { href: '/dashboard/search', icon: Search, label: 'Search' },
  { href: '/dashboard/favourites', icon: Heart, label: 'Favourites' },
  { href: '/dashboard/face-search', icon: Scan, label: 'My Photos' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
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
  collapsed = false,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  onClick?: () => void;
  badge?: number;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={clsx(
        'flex items-center rounded-xl transition-all text-sm font-medium group border',
        collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
        isActive
          ? 'bg-violet-600/15 text-violet-300 border-violet-500/20'
          : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border-transparent'
      )}
    >
      <Icon
        className={clsx(
          'w-5 h-5 shrink-0',
          isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'
        )}
      />
      {!collapsed && (
        <>
          <span>{label}</span>
          {badge != null && badge > 0 && (
            <span className="ml-auto bg-violet-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function UserChip({ user, collapsed = false }: { user: any; collapsed?: boolean }) {
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

  const avatar = user.avatar ? (
    <img src={user.avatar} alt={user.fullName} className="w-9 h-9 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
      {initials}
    </div>
  );

  if (collapsed) {
    return (
      <div className="flex justify-center py-2.5" title={user.fullName || user.username}>
        {avatar}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      {avatar}
      <div className="overflow-hidden">
        <p className="text-sm font-semibold text-white truncate">{user.fullName || user.username}</p>
        <p className={clsx('text-xs font-medium', roleColors[user.role] || 'text-gray-400')}>
          {user.role?.charAt(0) + user.role?.slice(1).toLowerCase().replace('_', ' ')}
        </p>
      </div>
    </div>
  );
}

function SidebarContent({
  collapsed,
  onClose,
}: {
  collapsed: boolean;
  onClose?: () => void;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    onClose?.();
    await logout();
    router.push('/');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] border-r border-[#1e1e2e]">
      {/* Logo */}
      <div
        className={clsx(
          'flex items-center border-b border-[#1e1e2e]',
          collapsed ? 'justify-center px-3 py-[22px]' : 'gap-2.5 px-5 py-5'
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <Camera className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-base tracking-tight">CIG Media</span>
        )}
      </div>

      {/* Nav */}
      <nav className={clsx('flex-1 py-4 space-y-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onClick={onClose} collapsed={collapsed} />
        ))}

        {/* Viewer: role request */}
        {user?.role === 'VIEWER' && (
          <>
            {!collapsed ? (
              <div className="pt-3 pb-1 px-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Upgrade</p>
              </div>
            ) : (
              <div className="my-2 border-t border-[#1e1e2e]" />
            )}
            <NavLink
              href="/dashboard/role-request"
              icon={Shield}
              label="Request Role"
              onClick={onClose}
              collapsed={collapsed}
            />
          </>
        )}

        {/* Admin actions */}
        {user?.role === 'ADMIN' && (
          <>
            {!collapsed ? (
              <div className="pt-3 pb-1 px-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Actions</p>
              </div>
            ) : (
              <div className="my-2 border-t border-[#1e1e2e]" />
            )}
            {adminActions.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                onClick={onClose}
                collapsed={collapsed}
              />
            ))}
          </>
        )}

        {/* Photographers / Club members: upload */}
        {(user?.role === 'PHOTOGRAPHER' || user?.role === 'CLUB_MEMBER') && (
          <>
            {!collapsed ? (
              <div className="pt-3 pb-1 px-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Actions</p>
              </div>
            ) : (
              <div className="my-2 border-t border-[#1e1e2e]" />
            )}
            <NavLink
              href="/dashboard/upload"
              icon={Upload}
              label="Upload Media"
              onClick={onClose}
              collapsed={collapsed}
            />
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div className={clsx('border-t border-[#1e1e2e] py-3 space-y-1', collapsed ? 'px-2' : 'px-3')}>
        {user && <UserChip user={user} collapsed={collapsed} />}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={clsx(
            'flex items-center w-full rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all group',
            collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:text-red-400 transition-colors" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );
}

export function DashboardSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile open button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0d0d14] border border-[#1e1e2e] rounded-xl shadow-lg"
      >
        <Menu className="w-5 h-5 text-gray-400" />
      </button>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:block fixed left-0 top-0 bottom-0 z-40 transition-[width] duration-300 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <SidebarContent collapsed={collapsed} />

        {/* Collapse / expand toggle button — floats on the right edge */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[68px] z-50 w-6 h-6 rounded-full bg-violet-600 border-2 border-[#0a0a0f] flex items-center justify-center hover:bg-violet-500 transition-colors shadow-lg"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-white" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-white" />
          )}
        </button>
      </aside>

      {/* Mobile sidebar (always full-width, no collapse) */}
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
              <SidebarContent collapsed={false} onClose={close} />
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
