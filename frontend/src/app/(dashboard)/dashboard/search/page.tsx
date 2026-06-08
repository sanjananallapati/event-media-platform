'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { MediaGrid } from '@/components/media/MediaGrid';
import { EventCard } from '@/components/events/EventCard';
import { Search, Image, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [results, setResults] = useState<any>(null); // null = no search attempted yet
  const [loading, setLoading] = useState(false);

  // Prevent double-execution when handleSubmit and useEffect both fire for the same query
  const lastSearchKeyRef = useRef('');

  const performSearch = useCallback(async (q: string, searchType: string) => {
    if (!q.trim()) return;

    const key = `${q.trim()}|${searchType}`;
    if (key === lastSearchKeyRef.current) return; // already running this exact search
    lastSearchKeyRef.current = key;

    setLoading(true);
    try {
      const response = await api.get('/search', {
        params: { q: q.trim(), type: searchType, limit: 20 },
      });
      setResults(response.data.data);
    } catch (error) {
      toast.error('Search failed. Please try again.');
      setResults({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle URL-driven searches (initial page load with params, back/forward navigation)
  useEffect(() => {
    const q = searchParams.get('q');
    const t = searchParams.get('type') || 'all';
    if (q) {
      setQuery(q);
      setType(t);
      performSearch(q, t);
    }
  }, [searchParams, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Reset the dedup key so re-submitting the same query works
    lastSearchKeyRef.current = '';

    // Update URL (for bookmarking / back-navigation), which also triggers the useEffect.
    // performSearch is guarded by lastSearchKeyRef so it only runs once.
    router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
    performSearch(query, type);
  };

  const hasResults =
    results !== null &&
    (results.media?.items?.length > 0 ||
      results.events?.items?.length > 0 ||
      results.users?.items?.length > 0);

  const hasNoResults = results !== null && !loading && !hasResults;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-secondary-500">Find media, events, and users</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for anything..."
            className="input pl-10"
            autoFocus
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="all">All</option>
          <option value="media">Media</option>
          <option value="events">Events</option>
          <option value="users">Users</option>
        </select>
        <button type="submit" className="btn-primary" disabled={loading}>
          Search
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results === null ? (
        /* Initial empty state — no search has been run yet */
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
