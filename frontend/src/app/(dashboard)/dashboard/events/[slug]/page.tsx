'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { MediaGrid } from '@/components/media/MediaGrid';
import { useAuthStore } from '@/store/auth.store';
import {
  Calendar, MapPin, Users, Camera, Share2,
  BookOpen, FolderOpen, Pencil, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { EditEventModal } from '@/components/events/EditEventModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function EventDetailPage() {
  const { slug }   = useParams();
  const router     = useRouter();
  const { user }   = useAuthStore();
  const [event,            setEvent]           = useState<any>(null);
  const [media,            setMedia]           = useState<any[]>([]);
  const [loading,          setLoading]         = useState(true);
  const [mediaPage,        setMediaPage]       = useState(1);
  const [totalMediaPages,  setTotalMediaPages] = useState(1);
  const [mediaType,        setMediaType]       = useState('');
  const [showEdit,         setShowEdit]        = useState(false);
  const [showDelEvent,     setShowDelEvent]    = useState(false);
  const [showDelAlbum,     setShowDelAlbum]    = useState(false);
  const [deletingEvent,    setDeletingEvent]   = useState(false);
  const [deletingAlbum,    setDeletingAlbum]   = useState(false);

  useEffect(() => { fetchEvent(); }, [slug]);
  useEffect(() => { if (event) fetchMedia(); }, [event, mediaPage, mediaType]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${slug}`);
      setEvent(response.data.data);
    } catch {
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
    } catch {
      console.error('Failed to load media');
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

  const handleDeleteEvent = async () => {
    setDeletingEvent(true);
    try {
      await api.delete(`/events/${event.id}`);
      toast.success('Event deleted');
      router.push('/dashboard/events');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete event');
    } finally {
      setDeletingEvent(false);
    }
  };

  const firstAlbum = event?.albums?.[0] ?? null;

  const handleDeleteAlbum = async () => {
    if (!firstAlbum) return;
    setDeletingAlbum(true);
    try {
      await api.delete(`/albums/${firstAlbum.id}`);
      toast.success('Album deleted');
      setShowDelAlbum(false);
      fetchEvent();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete album');
    } finally {
      setDeletingAlbum(false);
    }
  };

  const isOwner   = user?.id === event?.createdById;
  const isAdmin   = user?.role === 'ADMIN';
  const canManage = isOwner || isAdmin;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card p-12 text-center">
        <h2 className="text-xl font-medium text-white">Event not found</h2>
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
          <div className="h-52 sm:h-72 relative">
            <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117]/80 to-transparent" />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  {event.category.replace('_', ' ')}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#27272A] text-[#a1a1aa]">
                  {event.accessLevel}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white">{event.name}</h1>

              {event.albumName && (
                <div className="flex items-center gap-2 mt-2">
                  <BookOpen className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="text-sm text-violet-300 font-medium">{event.albumName}</span>
                </div>
              )}

              {event.description && (
                <p className="text-[#71717a] mt-2 text-sm leading-relaxed">{event.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-[#71717a]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(event.startDate), 'MMM dd, yyyy')}
                  {event.endDate && (
                    <> – {format(new Date(event.endDate), 'MMM dd, yyyy')}</>
                  )}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                )}
                {event.clubName && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {event.clubName}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  {event._count?.media || 0} photos/videos
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button onClick={handleShare} className="btn-secondary">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              {canManage && (
                <>
                  <button onClick={() => setShowEdit(true)} className="btn-secondary">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button onClick={() => setShowDelEvent(true)} className="btn-danger">
                    <Trash2 className="w-4 h-4" />
                    Delete Event
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Albums Section */}
      {event.albums && event.albums.length > 0 && (
        <div id="albums" className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Albums</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.albums.map((album: any) => (
              <div key={album.id} className="card p-4 flex items-start gap-3 hover:border-[#3f3f46] transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10 shrink-0">
                  <FolderOpen className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white line-clamp-1">{album.name}</p>
                  <p className="text-xs text-[#71717a]">{album._count?.media || 0} items</p>
                </div>
                {canManage && (
                  <button
                    onClick={() => setShowDelAlbum(true)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-[#52525b] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete album"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Filter */}
      <div className="flex items-center gap-3">
        {['', 'IMAGE', 'VIDEO'].map((type) => (
          <button
            key={type}
            onClick={() => { setMediaType(type); setMediaPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mediaType === type
                ? 'bg-violet-600 text-white'
                : 'btn-secondary'
            }`}
          >
            {type === '' ? 'All' : type === 'IMAGE' ? 'Photos' : 'Videos'}
          </button>
        ))}
      </div>

      <MediaGrid media={media} onRefresh={fetchMedia} />

      {totalMediaPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setMediaPage((p) => Math.max(1, p - 1))} disabled={mediaPage === 1} className="btn-secondary">Previous</button>
          <span className="text-sm text-[#71717a]">Page {mediaPage} of {totalMediaPages}</span>
          <button onClick={() => setMediaPage((p) => Math.min(totalMediaPages, p + 1))} disabled={mediaPage === totalMediaPages} className="btn-secondary">Next</button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showEdit && (
          <EditEventModal
            event={event}
            onClose={() => setShowEdit(false)}
            onUpdated={() => { setShowEdit(false); fetchEvent(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDelEvent && (
          <ConfirmDialog
            title="Delete Event"
            message={`Permanently delete "${event.name}"? All media and albums will be deleted. This cannot be undone.`}
            confirmText="Delete Event"
            loading={deletingEvent}
            onConfirm={handleDeleteEvent}
            onCancel={() => setShowDelEvent(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDelAlbum && firstAlbum && (
          <ConfirmDialog
            title="Delete Album"
            message={`Permanently delete the album "${firstAlbum.name}"? All media inside will be removed.`}
            confirmText="Delete Album"
            loading={deletingAlbum}
            onConfirm={handleDeleteAlbum}
            onCancel={() => setShowDelAlbum(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
