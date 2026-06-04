'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, Clock, CheckCircle, XCircle, ArrowRight, RefreshCw, Info } from 'lucide-react';
import { format } from 'date-fns';

interface RoleRequest {
  id: string;
  requestedRole: string;
  status: string;
  remarks: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewer: { username: string; fullName: string } | null;
}

const roleLabels: Record<string, string> = {
  CLUB_MEMBER: 'Club Member',
  PHOTOGRAPHER: 'Photographer',
};

const roleDescriptions: Record<string, string> = {
  CLUB_MEMBER: 'Access club-only events, download photos, and join the community.',
  PHOTOGRAPHER: 'Upload photos, manage albums, and contribute media to events.',
};

export default function RoleRequestPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [hasPending, setHasPending] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/role-requests/my');
      const data: RoleRequest[] = res.data.data || [];
      setRequests(data);
      setHasPending(data.some((r) => r.status === 'PENDING'));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/role-requests', { requestedRole: selectedRole, remarks });
      toast.success('Request submitted! Admin will review it shortly.');
      setSelectedRole('');
      setRemarks('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'APPROVED') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === 'REJECTED') return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  const statusColor = (status: string) => {
    if (status === 'APPROVED') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (status === 'REJECTED') return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-violet-400" />
          Role Upgrade Request
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Request an upgrade from Viewer to a higher role. An admin will review your request.
        </p>
      </div>

      {/* Current role */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-4 flex items-center gap-3">
        <Info className="w-4 h-4 text-violet-400 shrink-0" />
        <p className="text-sm text-gray-300">
          Your current role: <span className="text-white font-semibold">{user?.role || 'VIEWER'}</span>
          {user?.role !== 'VIEWER' && ' — role upgrades are only available for Viewers.'}
        </p>
      </div>

      {/* Form */}
      {user?.role === 'VIEWER' && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-white text-sm">Submit New Request</h2>

          {hasPending && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              You already have a pending request. Wait for admin review before submitting another.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection cards */}
            <div className="grid grid-cols-2 gap-3">
              {['CLUB_MEMBER', 'PHOTOGRAPHER'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  disabled={hasPending}
                  className={`p-4 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    selectedRole === role
                      ? 'border-violet-500 bg-violet-600/10'
                      : 'border-[#2a2a3a] bg-[#0d0d14] hover:border-violet-500/50'
                  }`}
                >
                  <p className="font-semibold text-white text-sm">{roleLabels[role]}</p>
                  <p className="text-xs text-gray-500 mt-1">{roleDescriptions[role]}</p>
                </button>
              ))}
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Reason <span className="text-gray-600 font-normal">(optional)</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Why do you need this role?"
                disabled={hasPending}
                rows={3}
                maxLength={500}
                className="w-full bg-[#0d0d14] border border-[#2a2a3a] text-white placeholder-gray-600 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-violet-500 transition-all resize-none disabled:opacity-40"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || hasPending || !selectedRole}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : (
                <>Submit Request <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Request history */}
      {!loading && requests.length > 0 && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e1e2e]">
            <h2 className="font-semibold text-white text-sm">Request History</h2>
          </div>
          <div className="divide-y divide-[#1e1e2e]">
            {requests.map((req) => (
              <div key={req.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{roleLabels[req.requestedRole] || req.requestedRole}</p>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${statusColor(req.status)}`}>
                      {statusIcon(req.status)}
                      {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Submitted {format(new Date(req.createdAt), 'd MMM yyyy')}
                  </p>
                  {req.remarks && (
                    <p className="text-xs text-gray-400 italic">"{req.remarks}"</p>
                  )}
                  {req.reviewer && (
                    <p className="text-xs text-gray-600">
                      Reviewed by @{req.reviewer.username}
                      {req.reviewedAt && ` · ${format(new Date(req.reviewedAt), 'd MMM yyyy')}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" />
        </div>
      )}
    </div>
  );
}
