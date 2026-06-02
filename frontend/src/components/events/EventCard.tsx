import Link from 'next/link';
import { Calendar, MapPin, Camera, Users } from 'lucide-react';
import { format } from 'date-fns';

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
    _count?: {
      media?: number;
      albums?: number;
    };
  };
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/dashboard/events/${event.slug}`} className="block">
      <div className="card overflow-hidden group hover:shadow-lg transition-shadow">
        <div className="relative h-48 bg-secondary-100 dark:bg-secondary-700">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-secondary-400" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-secondary-800/90 text-secondary-700 dark:text-secondary-200">
              {event.category.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary-600 transition-colors">
            {event.name}
          </h3>
          {event.description && (
            <p className="text-sm text-secondary-500 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-secondary-500">
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
          <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-secondary-400">
            <Camera className="w-3 h-3" />
            {event._count?.media || 0} photos/videos
          </div>
        </div>
      </div>
    </Link>
  );
}
