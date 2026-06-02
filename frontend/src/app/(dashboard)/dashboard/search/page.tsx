'use client';

import { useState, useEffect } from 'react';
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
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q, type);
    }
  }, [searchParams]);

  const performSearch = async (q: string, searchType: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const response = await api.get('/search', {
        params: { q, type: searchType, limit: 20 },
      });
      setResults(response.data.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(query)}&type=${type}`);
      performSearch(query, type);
    }
  };

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
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Media Results */}
          {results.media && results.media.items?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Media ({results.media.total})
              </h2>
              <MediaGrid media={results.media.items} />
            </motion.div>
          )}

          {/* Events Results */}
          {results.events && results.events.items?.length > 0 && (
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
          {results.users && results.users.items?.length > 0 && (
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
                      <p className="text-xs text-secondary-400">{user._count?.mediaUploads || 0} uploads</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* No Results */}
          {query &&
            !loading &&
            (!results.media?.items?.length &&
              !results.events?.items?.length &&
              !results.users?.items?.length) && (
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
