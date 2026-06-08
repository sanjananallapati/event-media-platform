'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowRight, Camera, Calendar, MapPin, Users, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: string; name: string; slug: string; description?: string; category: string;
  coverImage?: string; startDate: string; location?: string; clubName?: string;
  _count?: { media?: number; albums?: number };
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  PARTY:    { bg: 'bg-pink-500/15',    text: 'text-pink-400',    border: 'border-pink-500/25' },
  SPORTS:   { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  CULTURAL: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/25' },
  ACADEMIC: { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/25' },
  WORKSHOP: { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/25' },
  MEETUP:   { bg: 'bg-violet-500/15',  text: 'text-violet-400',  border: 'border-violet-500/25' },
  OTHER:    { bg: 'bg-[#27272A]',      text: 'text-[#A1A1AA]',   border: 'border-[#3f3f46]' },
};

function getCategoryStyle(cat: string) {
  return CATEGORY_STYLES[cat.toUpperCase()] ?? CATEGORY_STYLES.OTHER;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#161B22] overflow-hidden">
      <div className="h-52 bg-[#1C2230] animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-[#1C2230] rounded-lg animate-pulse w-3/4" />
        <div className="h-3 bg-[#1C2230] rounded-lg animate-pulse w-full" />
        <div className="h-px bg-[#27272A] mt-4" />
        <div className="h-3 bg-[#1C2230] rounded-lg animate-pulse w-1/3" />
      </div>
    </div>
  );
}

function DarkEventCard({ event, index }: { event: Event; index: number }) {
  const cat = getCategoryStyle(event.category);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <Link href={`/dashboard/events/${event.slug}`} className="block group">
        <div className="relative rounded-2xl border border-[#27272A] bg-[#161B22] overflow-hidden
          hover:border-[#3f3f46] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
          {/* Image */}
          <div className="relative h-52 bg-[#0D1117] overflow-hidden">
            {event.coverImage ? (
              <img src={event.coverImage} alt={event.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#1C2230] border border-[#27272A] flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#3f3f46]" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#161B22]/80 via-transparent to-transparent" />
            {/* Category badge */}
            <div className="absolute top-3.5 left-3.5">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-semibold tracking-wide uppercase backdrop-blur-sm ${cat.bg} ${cat.text} ${cat.border}`}>
                {event.category.replace(/_/g, ' ')}
              </span>
            </div>
            {/* Photo count */}
            {(event._count?.media ?? 0) > 0 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10">
                <ImageIcon className="w-3 h-3 text-white/70" />
                <span className="text-white/80 text-xs font-medium">{event._count?.media}</span>
              </div>
            )}
          </div>
          {/* Body */}
          <div className="p-5">
            <h3 className="text-white font-semibold text-lg leading-tight line-clamp-1 group-hover:text-violet-300 transition-colors duration-200 mb-1.5 font-display">
              {event.name}
            </h3>
            {event.description && (
              <p className="text-[#71717A] text-sm line-clamp-2 leading-relaxed mb-4">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-[#52525b]">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#3f3f46]" />{format(new Date(event.startDate), 'MMM dd, yyyy')}</span>
              {event.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#3f3f46]" /><span className="truncate max-w-[120px]">{event.location}</span></span>}
              {event.clubName && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#3f3f46]" /><span className="truncate max-w-[100px]">{event.clubName}</span></span>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function RecentEventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get('/events', { params: { limit: 6 } });
        setEvents(response.data.data || []);
      } catch { /* silently fail */ } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <section className="py-28 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) return null;

  return (
    <section className="relative py-28 bg-[#0D1117] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.25), transparent)' }} />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12">
          <div>
            <span
              className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
              style={{
                background: 'rgba(109,40,217,0.11)',
                border: '1px solid rgba(167,139,250,0.26)',
                color: '#c4b5fd',
                boxShadow: '0 0 18px rgba(109,40,217,0.16)',
              }}
            >
              Latest Activity
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight font-display">Recent Events</h2>
            <p className="text-[#71717A] mt-2 text-base">Discover the latest events and photos from your community</p>
          </div>
          <Link href="/events" className="hidden sm:inline-flex items-center gap-2 text-[#A1A1AA] hover:text-violet-400 text-sm font-medium transition-colors group shrink-0">
            View all events <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event, index) => <DarkEventCard key={event.id} event={event} index={index} />)}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/events" className="btn-secondary">View all events <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </section>
  );
}