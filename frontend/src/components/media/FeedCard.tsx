'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Download,
  Bookmark,
  Play,
  User as UserIcon,
  CalendarDays,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export interface FeedMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  originalName?: string;
  createdAt: string;
  uploader?: {
    id: string;
    username?: string;
    fullName?: string;
    avatar?: string | null;
  };
  event?: { id: string; name: string; slug: string } | null;
  tags?: { id: string; name: string }[];
  aiTags?: { id: string; name: string }[];
  likes?: { id: string }[];
  favourites?: { id: string }[];
  _count?: { likes?: number; comments?: number; favourites?: number };
}

interface FeedCardProps {
  media: FeedMedia;
  /** Whether the viewer is authenticated (gates like / save). */
  isAuthed?: boolean;
  index?: number;
}

export function FeedCard({ media, isAuthed = true, index = 0 }: FeedCardProps) {
  const [liked, setLiked] = useState<boolean>((media.likes?.length ?? 0) > 0);
  const [saved, setSaved] = useState<boolean>((media.favourites?.length ?? 0) > 0);
  const [likeCount, setLikeCount] = useState<number>(media._count?.likes ?? 0);
  const [burst, setBurst] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const lastTap = useRef(0);
  const busyLike = useRef(false);

  const username = media.uploader?.username || media.uploader?.fullName || 'unknown';
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(media.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  // Merge manual + AI tags into a deduped hashtag list (cap for tidiness).
  const hashtags = Array.from(
    new Map(
      [...(media.tags ?? []), ...(media.aiTags ?? [])].map((t) => [
        t.name.toLowerCase(),
        t.name,
      ])
    ).values()
  ).slice(0, 6);

  const commentCount = media._count?.comments ?? 0;

  async function toggleLike(showBurst = false) {
    if (!isAuthed) {
      toast.error('Sign in to like photos');
      return;
    }
    if (showBurst) {
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
    if (busyLike.current) return;
    busyLike.current = true;

    // Optimistic update.
    const prevLiked = liked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));

    try {
      const res = await api.post(`/media/${media.id}/like`);
      setLiked(res.data.data.liked);
      setLikeCount(res.data.data.count);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error('Could not update like');
    } finally {
      busyLike.current = false;
    }
  }

  async function toggleSave() {
    if (!isAuthed) {
      toast.error('Sign in to save photos');
      return;
    }
    const prev = saved;
    setSaved(!prev);
    try {
      const res = await api.post(`/media/${media.id}/favourite`);
      setSaved(res.data.data.favourited);
      toast.success(res.data.data.favourited ? 'Saved' : 'Removed from saved');
    } catch {
      setSaved(prev);
      toast.error('Could not update saved');
    }
  }

  function handleMediaTap() {
    // Double-tap → like with heart burst (images only; videos keep controls).
    if (media.type !== 'IMAGE') return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) toggleLike(true);
      else {
        setBurst(true);
        setTimeout(() => setBurst(false), 700);
      }
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }

  function handleDownload() {
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    window.open(`${base}/media/${media.id}/download`, '_blank');
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.04 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-violet-500/15 flex items-center justify-center shrink-0 ring-1 ring-violet-500/20">
          {media.uploader?.avatar ? (
            <img src={media.uploader.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-violet-300 text-sm font-semibold uppercase">
              {username.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate leading-tight">{username}</p>
          <p className="text-xs text-[#71717a] leading-tight">{timeAgo}</p>
        </div>
        {media.event && (
          <Link
            href={`/dashboard/events/${media.event.slug}`}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#1C2230] text-[#a1a1aa] border border-[#27272A] hover:text-white hover:border-violet-500/40 transition-colors max-w-[180px]"
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{media.event.name}</span>
          </Link>
        )}
      </div>

      {/* Media */}
      <div
        onClick={handleMediaTap}
        className="relative bg-[#0A0A0F] flex items-center justify-center select-none cursor-pointer"
        style={{ minHeight: 220 }}
      >
        {!imgLoaded && media.type === 'IMAGE' && (
          <div className="absolute inset-0 shimmer-bg" aria-hidden />
        )}

        {media.type === 'IMAGE' ? (
          <img
            src={media.url}
            alt={media.caption || media.originalName || 'photo'}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
            className={`w-full max-h-[78vh] object-contain transition-opacity duration-500 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <video
            src={media.url}
            poster={media.thumbnailUrl || undefined}
            controls
            preload="metadata"
            className="w-full max-h-[78vh]"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Double-tap heart burst */}
        <AnimatePresence>
          {burst && (
            <motion.div
              key="burst"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, times: [0, 0.4, 1] }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {media.type === 'VIDEO' && !media.url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/55 flex items-center justify-center">
              <Play className="w-7 h-7 text-white fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => toggleLike(false)}
            aria-label={liked ? 'Unlike' : 'Like'}
            className="group"
          >
            <Heart
              className={`w-6 h-6 transition-all duration-200 group-active:scale-90 ${
                liked ? 'text-red-500 fill-red-500' : 'text-[#a1a1aa] group-hover:text-red-400'
              }`}
            />
          </button>
          <Link href={`/dashboard/media/${media.id}`} aria-label="Comments" className="group">
            <MessageCircle className="w-6 h-6 text-[#a1a1aa] group-hover:text-white transition-colors group-active:scale-90" />
          </Link>
          <button onClick={handleDownload} aria-label="Download" className="group">
            <Download className="w-6 h-6 text-[#a1a1aa] group-hover:text-white transition-colors group-active:scale-90" />
          </button>
        </div>
        <button onClick={toggleSave} aria-label={saved ? 'Unsave' : 'Save'} className="group">
          <Bookmark
            className={`w-6 h-6 transition-all duration-200 group-active:scale-90 ${
              saved ? 'text-violet-400 fill-violet-400' : 'text-[#a1a1aa] group-hover:text-white'
            }`}
          />
        </button>
      </div>

      {/* Like count + caption + hashtags + comments */}
      <div className="px-4 pb-4 space-y-1.5">
        <p className="text-sm font-semibold text-white">
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </p>

        {media.caption && (
          <p className="text-sm text-[#d4d4d8] leading-relaxed">
            <span className="font-semibold text-white mr-1.5">{username}</span>
            {media.caption}
          </p>
        )}

        {hashtags.length > 0 && (
          <p className="text-sm text-violet-400 leading-relaxed flex flex-wrap gap-x-2">
            {hashtags.map((tag) => (
              <Link
                key={tag}
                href={`/dashboard/gallery?q=${encodeURIComponent(tag)}`}
                className="hover:text-violet-300 hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </p>
        )}

        {commentCount > 0 && (
          <Link
            href={`/dashboard/media/${media.id}`}
            className="block text-sm text-[#71717a] hover:text-[#a1a1aa] transition-colors pt-0.5"
          >
            View all {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </Link>
        )}
      </div>
    </motion.article>
  );
}
