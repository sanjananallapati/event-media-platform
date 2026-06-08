'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Search, X, User, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaggableUser {
  id: string;
  username: string;
  fullName: string;
  avatar?: string | null;
}

interface TagPeopleModalProps {
  mediaId: string;
  /** ids of users already tagged in this media */
  existingTagIds: string[];
  /** id of the logged-in user, used to label "You" */
  currentUserId?: string;
  onClose: () => void;
  /** called with the newly created tag (includes taggedUser) so the parent can update */
  onTagged: (tag: any) => void;
}

export function TagPeopleModal({
  mediaId,
  existingTagIds,
  currentUserId,
  onClose,
  onTagged,
}: TagPeopleModalProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<TaggableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [taggingId, setTaggingId] = useState<string | null>(null);
  const [tagged, setTagged] = useState<Set<string>>(new Set(existingTagIds));
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus the search box on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Debounced search (empty query loads a default list)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/search', {
          params: { type: 'users', q: query.trim(), limit: 10 },
        });
        if (!cancelled) {
          setUsers(res.data?.data?.users?.items ?? []);
        }
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const handleTag = async (u: TaggableUser) => {
    setTaggingId(u.id);
    try {
      const res = await api.post(`/media/${mediaId}/tag`, { taggedUserId: u.id });
      setTagged((prev) => new Set(prev).add(u.id));
      onTagged(res.data.data);
      toast.success(`Tagged ${u.fullName || u.username}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to tag');
    } finally {
      setTaggingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg card p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-2xl font-bold text-white">Tag a person</h2>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-white transition-colors -mt-1 -mr-1 p-1"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-[#A1A1AA] mb-5">
          Search for someone to tag in this photo
        </p>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or username"
            className="input pl-10"
          />
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto -mx-1 px-1">
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-[#52525b]">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-[#A1A1AA] text-center py-10">
              No people found
            </p>
          ) : (
            users.map((u) => {
              const isTagged = tagged.has(u.id);
              const isBusy = taggingId === u.id;
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl border border-[#27272A] bg-[#0D1117] px-3 py-3"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-primary-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-primary-300">
                        {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">
                      {u.fullName || u.username}
                      {currentUserId === u.id && (
                        <span className="ml-1.5 text-xs font-normal text-[#A1A1AA]">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[#A1A1AA] truncate">@{u.username}</p>
                  </div>

                  {/* Action */}
                  {isTagged ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-400 px-2">
                      <Check className="w-4 h-4" />
                      Tagged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTag(u)}
                      disabled={isBusy}
                      className="text-sm font-semibold text-primary-400 hover:text-primary-300 disabled:opacity-50 px-2 py-1 transition-colors"
                    >
                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tag'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
