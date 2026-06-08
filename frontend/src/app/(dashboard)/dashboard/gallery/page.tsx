'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  X,
  GalleryVertical,
  LayoutGrid,
  Rows,
  Play,
  Heart,
  ArrowUp,
  ImageOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { FeedCard, type FeedMedia } from '@/components/media/FeedCard';
import { FeedSkeleton } from '@/components/media/FeedSkeleton';

const LIMIT = 6;
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'IMAGE', label: 'Photos' },
  { value: 'VIDEO', label: 'Videos' },
];

export default function GalleryPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get('q') || '';

  const [items, setItems] = useState<FeedMedia[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [type, setType] = useState('');
  const [input, setInput] = useState(urlQ);
  const [query, setQuery] = useState(urlQ); // debounced value actually sent
  const [view, setView] = useState<'feed' | 'grid'>('feed');
  const [showTop, setShowTop] = useState(false);

  const reqId = useRef(0); // newest request wins, prevents race conditions

  // Pick up ?q= changes (e.g. tapping a #hashtag elsewhere).
  useEffect(() => {
    setInput(urlQ);
  }, [urlQ]);

  // Debounce the search box → query.
  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const myReq = ++reqId.current;
      replace ? setInitialLoading(true) : setLoadingMore(true);
      try {
        const params: Record<string, string | number> = { page: pageToLoad, limit: LIMIT };
        if (type) params.type = type;
        if (query) params.q = query;

        const res = await api.get('/media/gallery', { params });
        if (myReq !== reqId.current) return; // a newer request superseded this one

        const data: FeedMedia[] = res.data.data || [];
        const meta = res.data.meta || {};
        setTotal(meta.total ?? data.length);
        setHasMore((meta.page ?? pageToLoad) < (meta.totalPages ?? 1));
        setPage(pageToLoad);
        setItems((prev) => {
          if (replace) return data;
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...data.filter((m) => !seen.has(m.id))];
        });
      } catch {
        if (myReq === reqId.current) toast.error('Failed to load gallery');
      } finally {
        if (myReq === reqId.current) {
          setInitialLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [type, query]
  );

  // Reset and reload page 1 whenever the filters change.
  useEffect(() => {
    setItems([]);
    setHasMore(true);
    setPage(1);
    fetchPage(1, true);
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    fetchPage(page + 1, false);
  }, [fetchPage, page]);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    loading: initialLoading || loadingMore,
    onLoadMore: handleLoadMore,
  });

  // Scroll-to-top affordance.
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const clearAll = () => {
    setInput('');
    setType('');
  };

  const hasFilters = !!type || !!query;
  const isEmpty = !initialLoading && items.length === 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white">Gallery</h1>
        <p className="text-[#71717a] text-sm mt-1">
          {total} public photo{total === 1 ? '' : 's'} &amp; video
          {total === 1 ? '' : 's'}
        </p>
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 -mx-1 px-1 py-3 mb-4 bg-[#0A0A0F]/85 backdrop-blur-xl border-b border-[#27272A]/60">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b] pointer-events-none" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search captions, tags, #hashtags…"
              className="input pl-9 pr-9"
            />
            {input && (
              <button
                onClick={() => setInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Type filters */}
            <div className="flex items-center gap-1.5 bg-[#0D1117] border border-[#27272A] rounded-xl p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setType(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    type === f.value
                      ? 'bg-violet-600 text-white'
                      : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-[#0D1117] border border-[#27272A] rounded-xl p-1">
              <button
                onClick={() => setView('feed')}
                aria-label="Feed view"
                className={`p-1.5 rounded-lg transition-colors ${
                  view === 'feed' ? 'bg-violet-600 text-white' : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                <Rows className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded-lg transition-colors ${
                  view === 'grid' ? 'bg-violet-600 text-white' : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {hasFilters && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-[#a1a1aa] hover:text-white border border-[#27272A] hover:border-[#3f3f46] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {initialLoading ? (
        view === 'feed' ? (
          <div className="space-y-6">
            <FeedSkeleton count={3} />
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 gap-3 [&>*]:mb-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="shimmer-bg rounded-xl"
                style={{ height: 140 + (i % 3) * 50 }}
              />
            ))}
          </div>
        )
      ) : isEmpty ? (
        <div className="card p-12 text-center">
          <ImageOff className="w-12 h-12 text-[#3f3f46] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No media found</h3>
          <p className="text-[#71717a] mt-1 text-sm">
            {hasFilters ? 'Try a different search or filter.' : 'Nothing has been shared publicly yet.'}
          </p>
          {hasFilters && (
            <button onClick={clearAll} className="btn-secondary mt-4 mx-auto">
              Clear filters
            </button>
          )}
        </div>
      ) : view === 'feed' ? (
        <div className="space-y-6">
          {items.map((m, i) => (
            <FeedCard key={m.id} media={m} index={i} isAuthed={!!user} />
          ))}
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 gap-3 [&>*]:mb-3">
          {items.map((m) => (
            <Link
              key={m.id}
              href={`/dashboard/media/${m.id}`}
              className="group relative block rounded-xl overflow-hidden bg-[#0D1117] break-inside-avoid"
            >
              <img
                src={m.thumbnailUrl || m.url}
                alt={m.caption || m.originalName || 'photo'}
                loading="lazy"
                className="w-full object-cover group-hover:opacity-90 transition-opacity"
              />
              {m.type === 'VIDEO' && (
                <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                </span>
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                <span className="flex items-center gap-1 text-white text-xs font-medium">
                  <Heart className="w-3.5 h-3.5" />
                  {m._count?.likes ?? 0}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Infinite-scroll sentinel + loaders */}
      {!isEmpty && !initialLoading && (
        <div ref={sentinelRef} className="py-8">
          {loadingMore ? (
            <div className="flex items-center justify-center gap-2 text-[#71717a]">
              <span className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading more…</span>
            </div>
          ) : !hasMore ? (
            <div className="flex items-center justify-center gap-2 text-[#52525b]">
              <GalleryVertical className="w-4 h-4" />
              <span className="text-sm">You&apos;ve reached the end</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Scroll to top */}
      {showTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.5)] hover:bg-violet-500 transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}
