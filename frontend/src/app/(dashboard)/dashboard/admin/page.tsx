'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users,
  Camera,
  Shield,
  TrendingUp,
  Calendar,
  Image,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  Search,
  Home,
  LayoutGrid,
  UserCog,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'role-requests' | 'manage-users';
type RequestFilter = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Stats {
  roleRequests: { pending: number; approved: number; rejected: number };
  users: { total: number; photographers: number; clubMembers: number };
  platform: { events: number; media: number };
}

interface RoleRequest {
  id: string;
  requestedRole: string;
  status: string;
  remarks: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; username: string; fullName: string; email: string; avatar?: string; role: string };
  reviewer: { id: string; username: string; fullName: string } | null;
}

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function roleBadge(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'bg-red-500/20 text-red-300 border-red-500/30',
    PHOTOGRAPHER: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    CLUB_MEMBER: 'bg-green-500/20 text-green-300 border-green-500/30',
    VIEWER: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };
  const labels: Record<string, string> = {
    ADMIN: 'Admin',
    PHOTOGRAPHER: 'Photographer',
    CLUB_MEMBER: 'Member',
    VIEWER: 'Viewer',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${map[role] || map.VIEWER}`}>
      {labels[role] || role}
    </span>
  );
}

function Avatar({ name, src, size = 8 }: { name: string; src?: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  if (src)
    return (
      <img
        src={src}
        alt={name}
        className={`w-${size} h-${size} rounded-full object-cover bg-[#1e1e2e]`}
      />
    );
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-violet-600 flex items-center justify-center text-white font-bold`}
      style={{ fontSize: size * 2.5 }}
    >
      {initials}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('PENDING');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState<Record<string, string>>({});

  // Guard: redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/role-requests/stats');
      setStats(res.data.data);
    } catch {}
  }, []);

  const fetchRecentUsers = useCallback(async () => {
    try {
      const res = await api.get('/users?limit=5');
      setRecentUsers(res.data.data.users || []);
    } catch {}
  }, []);

  const fetchRoleRequests = useCallback(async () => {
    try {
      const res = await api.get(`/role-requests?status=${requestFilter}&limit=50`);
      setRoleRequests(res.data.data.requests || []);
    } catch {}
  }, [requestFilter]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (userSearch) params.set('search', userSearch);
      if (userRoleFilter) params.set('role', userRoleFilter);
      const res = await api.get(`/users?${params}`);
      setAllUsers(res.data.data.users || []);
    } catch {}
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRecentUsers()]);
      setLoading(false);
    };
    init();
  }, [fetchStats, fetchRecentUsers]);

  useEffect(() => {
    if (tab === 'role-requests') fetchRoleRequests();
  }, [tab, requestFilter, fetchRoleRequests]);

  useEffect(() => {
    if (tab === 'manage-users') fetchAllUsers();
  }, [tab, userSearch, userRoleFilter, fetchAllUsers]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      await api.patch(`/role-requests/${id}/approve`);
      toast.success('Request approved!');
      fetchRoleRequests();
      fetchStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + '-reject');
    try {
      await api.patch(`/role-requests/${id}/reject`, { remarks: rejectRemarks[id] || '' });
      toast.success('Request rejected');
      fetchRoleRequests();
      fetchStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      fetchAllUsers();
      fetchStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove @${username}? This action cannot be undone.`)) return;
    setActionLoading(userId + '-delete');
    try {
      await api.delete(`/users/${userId}`);
      toast.success(`@${username} has been removed`);
      fetchAllUsers();
      fetchStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to remove user');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  // ── Tabs config (Assign Photographers removed)
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'role-requests', label: 'Role Requests', icon: Shield },
    { id: 'manage-users', label: 'Manage Users', icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage users, roles, and event assignments</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 border-b border-[#1e1e2e] overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                tab === id
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'role-requests' && stats?.roleRequests.pending ? (
                <span className="ml-1 bg-violet-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {stats.roleRequests.pending}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* Stat cards row 1 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', value: stats?.users.total ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { label: 'Total Events', value: stats?.platform.events ?? 0, icon: Calendar, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                    { label: 'Total Media', value: stats?.platform.media ?? 0, icon: Image, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    {
                      label: 'Pending Requests',
                      value: stats?.roleRequests.pending ?? 0,
                      icon: Shield,
                      color: 'text-violet-400',
                      bg: 'bg-violet-500/10 border-violet-500/20',
                      sub: stats?.roleRequests.pending === 0 ? 'All clear' : 'Needs attention',
                    },
                  ].map(({ label, value, icon: Icon, color, bg, sub }) => (
                    <div key={label} className={`rounded-2xl border bg-[#111118] border-[#1e1e2e] p-5 space-y-3`}>
                      <div className={`w-10 h-10 rounded-xl ${bg} border flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">{value}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{label}</p>
                        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stat cards row 2 */}
                <div className="grid grid-cols-2 gap-4 lg:max-w-sm">
                  {[
                    { label: 'Photographers', value: stats?.users.photographers ?? 0, icon: Camera, color: 'text-purple-400' },
                    { label: 'Active Members', value: stats?.users.clubMembers ?? 0, icon: Users, color: 'text-cyan-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-2xl border bg-[#111118] border-[#1e1e2e] p-5 space-y-3">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <div>
                        <p className="text-3xl font-bold text-white">{value}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Users */}
                <div className="rounded-2xl border bg-[#111118] border-[#1e1e2e] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e]">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-400" />
                      <h3 className="font-semibold text-white">Recent Users</h3>
                    </div>
                    <button
                      onClick={() => setTab('manage-users')}
                      className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="divide-y divide-[#1e1e2e]">
                    {recentUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.fullName} src={u.avatar} size={9} />
                          <div>
                            <p className="text-sm font-medium text-white">@{u.username}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {roleBadge(u.role)}
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {format(new Date(u.createdAt), 'd/M/yyyy')}
                          </span>
                        </div>
                      </div>
                    ))}
                    {recentUsers.length === 0 && (
                      <p className="px-6 py-4 text-sm text-gray-500">No users yet.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ROLE REQUESTS TAB ────────────────────────────────────── */}
        {tab === 'role-requests' && (
          <div className="space-y-5">
            {/* Filter Pills */}
            <div className="flex gap-2">
              {(['PENDING', 'APPROVED', 'REJECTED'] as RequestFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setRequestFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    requestFilter === f
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-transparent text-gray-400 border-[#2a2a3a] hover:border-violet-500 hover:text-violet-300'
                  }`}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                  {f === 'PENDING' && stats?.roleRequests.pending ? ` (${stats.roleRequests.pending})` : ''}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border bg-[#111118] border-[#1e1e2e] overflow-hidden">
              <div className="divide-y divide-[#1e1e2e]">
                {roleRequests.length === 0 && (
                  <p className="px-6 py-8 text-center text-gray-500 text-sm">
                    No {requestFilter.toLowerCase()} requests.
                  </p>
                )}
                {roleRequests.map((req) => (
                  <div key={req.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={req.user.fullName} src={req.user.avatar} size={10} />
                        <div>
                          <p className="font-semibold text-white text-sm">@{req.user.username}</p>
                          <p className="text-xs text-gray-500">{req.user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {roleBadge(req.user.role)}
                            <span className="text-gray-500 text-xs">→</span>
                            {roleBadge(req.requestedRole)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 shrink-0">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {format(new Date(req.createdAt), 'd MMM yyyy')}
                        {req.status === 'APPROVED' && (
                          <div className="flex items-center gap-1 text-green-400 mt-1">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </div>
                        )}
                        {req.status === 'REJECTED' && (
                          <div className="flex items-center gap-1 text-red-400 mt-1">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </div>
                        )}
                      </div>
                    </div>

                    {req.remarks && (
                      <p className="text-xs text-gray-400 bg-[#0a0a0f] rounded-lg px-3 py-2">
                        "{req.remarks}"
                      </p>
                    )}

                    {req.status === 'PENDING' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Optional rejection reason…"
                          value={rejectRemarks[req.id] || ''}
                          onChange={(e) =>
                            setRejectRemarks((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          className="w-full bg-[#0a0a0f] border border-[#2a2a3a] text-white placeholder-gray-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 transition-all"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoading === req.id + '-approve'}
                            className="flex-1 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-300 text-xs font-semibold border border-green-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {actionLoading === req.id + '-approve' ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoading === req.id + '-reject'}
                            className="flex-1 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold border border-red-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {actionLoading === req.id + '-reject' ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {req.reviewer && (
                      <p className="text-xs text-gray-600">
                        Reviewed by @{req.reviewer.username}
                        {req.reviewedAt && ` on ${format(new Date(req.reviewedAt), 'd MMM yyyy')}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MANAGE USERS TAB ─────────────────────────────────────── */}
        {tab === 'manage-users' && (
          <div className="space-y-5">
            {/* Search + filter */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-[#111118] border border-[#2a2a3a] text-white placeholder-gray-600 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-[#111118] border border-[#2a2a3a] text-gray-300 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-violet-500 transition-all"
              >
                <option value="">All Roles</option>
                <option value="VIEWER">Viewer</option>
                <option value="CLUB_MEMBER">Club Member</option>
                <option value="PHOTOGRAPHER">Photographer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="rounded-2xl border bg-[#111118] border-[#1e1e2e] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1e1e2e]">
                <h3 className="font-semibold text-white text-sm">
                  All Users{' '}
                  <span className="text-gray-500 font-normal">({allUsers.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2e]">
                      {['User', 'Joined', 'Role', 'Change Role', 'Actions'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e2e]">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#0d0d14] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.fullName} src={u.avatar} size={9} />
                            <div>
                              <p className="text-sm font-medium text-white">@{u.username}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {format(new Date(u.createdAt), 'd/M/yyyy')}
                        </td>
                        <td className="px-6 py-4">{roleBadge(u.role)}</td>
                        <td className="px-6 py-4">
                          <div className="relative inline-block">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="appearance-none bg-[#1a1a25] border border-[#2a2a3a] text-gray-300 rounded-lg py-1.5 pl-3 pr-8 text-xs focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                            >
                              <option value="VIEWER">viewer</option>
                              <option value="CLUB_MEMBER">member</option>
                              <option value="PHOTOGRAPHER">photographer</option>
                              <option value="ADMIN">admin</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              disabled={actionLoading === u.id + '-delete'}
                              title="Remove user"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/25 text-red-400 hover:text-red-300 text-xs font-medium border border-red-600/20 hover:border-red-600/40 transition-all disabled:opacity-40"
                            >
                              {actionLoading === u.id + '-delete' ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {allUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
