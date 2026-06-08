'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { MediaGrid } from '@/components/media/MediaGrid';
import { EventCard } from '@/components/events/EventCard';
import { Search, Image, Calendar, User, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tags, setTags] = useState(searchParams.get('tags') || '');
  const [eventName, setEventName] = useState(searchParams.get('event') || '');
  const [uploadDate, setUploadDate] = useState(searchParams.get('date') || '');
  const [username, setUsername] = useState(searchParams.get('username') || '');

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const lastSearchKeyRef = useRef('');

  const performSearch = useCallback(
    async (params: {
      q: string;
      tags: string;
      eventName: string;
      uploadDate: string;
      username: string;
    }) => {
      const hasAnyInput =
        params.q.trim() ||
        params.tags.trim() ||
        params.eventName.trim() ||
        params.uploadDate ||
        params.username.trim();

      if (!hasAnyInput) return;

      const key = JSON.stringify(params);
      if (key === lastSearchKeyRef.current) return;
      lastSearchKeyRef.current = key;

      setLoading(true);
      try {
        const apiParams: Record<string, string> = {
          type: 'all',
          limit: '20',
        };

        if (params.q.trim()) apiParams.q = params.q.trim();
        if (params.tags.trim()) apiParams.tags = params.tags.trim();
        if (params.eventName.trim()) apiParams.event = params.eventName.trim();
        if (params.username.trim()) apiParams.username = params.username.trim();
        if (params.uploadDate) {
          const d = new Date(params.uploadDate);
          const start = new Date(d);
          start.setHours(0, 0, 0, 0);
          const end = new Date(d);
          end.setHours(23, 59, 59, 999);
          apiParams.startDate = start.toISOString();
          apiParams.endDate = end.toISOString();
        }

        const response = await api.get('/search', { params: apiParams });
        setResults(response.data.data);
      } catch (error) {
        toast.error('Search failed. Please try again.');
        setResults({});
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // URL-driven search on mount / navigation
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const t = searchParams.get('tags') || '';
    const e = searchParams.get('event') || '';
    const d = searchParams.get('date') || '';
    const u = searchParams.get('username') || '';
    if (q || t || e || d || u) {
      setQuery(q);
      setTags(t);
      setEventName(e);
      setUploadDate(d);
      setUsername(u);
      performSearch({ q, tags: t, eventName: e, uploadDate: d, username: u });
    }
  }, [searchParams, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lastSearchKeyRef.current = '';

    const urlParams = new URLSearchParams();
    if (query.trim()) urlParams.set('q', query.trim());
    if (tags.trim()) urlParams.set('tags', tags.trim());
    if (eventName.trim()) urlParams.set('event', eventName.trim());
    if (uploadDate) urlParams.set('date', uploadDate);
    if (username.trim()) urlParams.set('username', username.trim());

    router.push(`/dashboard/search?${urlParams.toString()}`);
    performSearch({ q: query, tags, eventName, uploadDate, username });
  };

  const hasResults =
    results !== null &&
    (results.media?.items?.length > 0 ||
      results.events?.items?.length > 0 ||
      results.users?.items?.length > 0);

  const hasNoResults = results !== null && !loading && !hasResults;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Advanced Search</h1>
        <p className="text-secondary-500">Search by tags, event, date, or username</p>
      </div>

      {/* Search Card */}
      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        {/* Main search bar row */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="input pl-10"
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary px-8" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#27272A]" />

        {/* Filter fields row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Tags */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-secondary-400">
              Tags
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-500" />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="mountains, people..."
                className="input pl-8 text-xs py-2"
              />
            </div>
          </div>

          {/* Event Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-secondary-400">
              Event Name
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-500" />
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Cultural Fest..."
                className="input pl-8 text-xs py-2"
              />
            </div>
          </div>

          {/* Upload Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-secondary-400">
              Upload Date
            </label>
            <input
              type="date"
              value={uploadDate}
              onChange={(e) => setUploadDate(e.target.value)}
              className="input text-xs py-2 [color-scheme:dark]"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-secondary-400">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="photographer1..."
                className="input pl-8 text-xs py-2"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results === null ? (
        <div className="card p-12 text-center text-secondary-400">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">Start typing to search</p>
          <p className="text-sm mt-1">Find media, events, and users across the platform</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Media Results */}
          {results.media?.items?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Media ({results.media.total})
              </h2>
              <MediaGrid media={results.media.items} />
            </motion.div>
          )}

          {/* Events Results */}
          {results.events?.items?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Events ({results.events.total})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.events.items.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Users Results */}
          {results.users?.items?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Users ({results.users.total})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.users.items.map((user: any) => (
                  <div key={user.id} className="card p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-12 h-12 object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-secondary-500">@{user.username}</p>
                      <p className="text-xs text-secondary-400">
                        {user._count?.mediaUploads || 0} uploads
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* No Results */}
          {hasNoResults && (
            <div className="card p-12 text-center">
              <Search className="w-12 h-12 mx-auto text-secondary-400 mb-4" />
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-secondary-500 mt-1">
                Try different keywords or filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
