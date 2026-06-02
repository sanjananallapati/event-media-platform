'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { MediaGrid } from '@/components/media/MediaGrid';
import { useAuthStore } from '@/store/auth.store';
import { Calendar, MapPin, Users, Camera, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function EventDetailPage() {
  const { slug } = useParams();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaPage, setMediaPage] = useState(1);
  const [totalMediaPages, setTotalMediaPages] = useState(1);
  const [mediaType, setMediaType] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  useEffect(() => {
    if (event) fetchMedia();
  }, [event, mediaPage, mediaType]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${slug}`);
      setEvent(response.data.data);
    } catch (error) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      const params: any = { page: mediaPage, limit: 20 };
      if (mediaType) params.type = mediaType;
      const response = await api.get(`/events/${slug}/media`, { params });
      setMedia(response.data.data);
      setTotalMediaPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load media:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: event?.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card p-12 text-center">
        <h2 className="text-xl font-medium">Event not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        {event.coverImage && (
          <div className="h-48 sm:h-64 relative">
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {event.category.replace('_', ' ')}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300">
                  {event.accessLevel}
                </span>
              </div>
              <h1 className="text-2xl font-bold">{event.name}</h1>
              {event.description && (
                <p className="text-secondary-500 mt-2">{event.description}</p>
              )}
            </div>
            <button onClick={handleShare} className="btn-secondary">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-secondary-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(event.startDate), 'MMM dd, yyyy')}
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </div>
            )}
            {event.clubName && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {event.clubName}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Camera className="w-4 h-4" />
              {event._count?.media || 0} photos/videos
            </div>
          </div>
        </div>
      </motion.div>

      {/* Media Filter */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setMediaType(''); setMediaPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !mediaType ? 'bg-primary-600 text-white' : 'btn-secondary'
          }`}
        >
          All
        </button>
        <button
          onClick={() => { setMediaType('IMAGE'); setMediaPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mediaType === 'IMAGE' ? 'bg-primary-600 text-white' : 'btn-secondary'
          }`}
        >
          Photos
        </button>
        <button
          onClick={() => { setMediaType('VIDEO'); setMediaPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mediaType === 'VIDEO' ? 'bg-primary-600 text-white' : 'btn-secondary'
          }`}
        >
          Videos
        </button>
      </div>

      {/* Media Grid */}
      <MediaGrid media={media} onRefresh={fetchMedia} />

      {/* Pagination */}
      {totalMediaPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setMediaPage((p) => Math.max(1, p - 1))}
            disabled={mediaPage === 1}
            className="btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-secondary-500">
            Page {mediaPage} of {totalMediaPages}
          </span>
          <button
            onClick={() => setMediaPage((p) => Math.min(totalMediaPages, p + 1))}
            disabled={mediaPage === totalMediaPages}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
