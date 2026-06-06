'use client';

import Link from 'next/link';
import { Calendar, MapPin, Camera, Users, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { EventActionsMenu } from './EventActionsMenu';
import { useAuthStore } from '@/store/auth.store';

interface EventCardProps {
  event: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    category: string;
    coverImage?: string;
    startDate: string;
    location?: string;
    clubName?: string;
    albumName?: string;
    createdById?: string;
    albums?: any[];
    _count?: {
      media?: number;
      albums?: number;
    };
  };
  onRefresh?: () => void;
}

export function EventCard({ event, onRefresh }: EventCardProps) {
  const { user } = useAuthStore();
  const isOwner  = user?.id === event.createdById;
  const isAdmin  = user?.role === 'ADMIN';
  const canManage = isOwner || isAdmin;

  return (
    <div className="card overflow-hidden group hover:border-[#3f3f46] hover:shadow-lg transition-all duration-200 relative">
      {/* Actions menu */}
      {canManage && onRefresh && (
        <div className="absolute top-3 right-3 z-10">
          <EventActionsMenu event={event} onRefresh={onRefresh} />
        </div>
      )}

      <Link href={`/dashboard/events/${event.slug}`} className="block">
        {/* Cover */}
        <div className="relative h-48 bg-[#161B22]">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-[#3f3f46]" />
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#0D1117]/80 text-[#a1a1aa] border border-[#27272A]">
              {event.category.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="font-semibold text-base text-white line-clamp-1 group-hover:text-violet-300 transition-colors">
            {event.name}
          </h3>

          {event.albumName && (
            <div className="flex items-center gap-1.5 mt-1">
              <BookOpen className="w-3 h-3 text-violet-400 shrink-0" />
              <span className="text-xs text-violet-300 line-clamp-1">{event.albumName}</span>
            </div>
          )}

          {event.description && (
            <p className="text-sm text-[#71717a] mt-1.5 line-clamp-2">{event.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#71717a]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(event.startDate), 'MMM dd, yyyy')}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            )}
            {event.clubName && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {event.clubName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#27272A] text-xs text-[#52525b]">
            <Camera className="w-3 h-3" />
            {event._count?.media || 0} media · {event._count?.albums || 0} albums
          </div>
        </div>
      </Link>
    </div>
  );
}
