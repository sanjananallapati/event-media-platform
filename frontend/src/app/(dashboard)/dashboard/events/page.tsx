'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { EventCard } from '@/components/events/EventCard';
import { CreateEventModal } from '@/components/events/CreateEventModal';
import { useAuthStore } from '@/store/auth.store';
import { Search, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventsPage() {
  const { user } = useAuthStore();
  const [events,          setEvents]          = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [category,        setCategory]        = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page,            setPage]            = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);

  useEffect(() => {
    fetchEvents();
  }, [page, search, category]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 12 };
      if (search)   params.search   = search;
      if (category) params.category = category;
      const response = await api.get('/events', { params });
      setEvents(response.data.data);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const canCreate = user?.role && ['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'].includes(user.role);

  const categories = [
    { value: '',              label: 'All Categories' },
    { value: 'PHOTOSHOOT',   label: 'Photoshoot' },
    { value: 'WORKSHOP',     label: 'Workshop' },
    { value: 'TRIP',         label: 'Trip' },
    { value: 'COMPETITION',  label: 'Competition' },
    { value: 'CULTURAL_FEST',label: 'Cultural Fest' },
    { value: 'PARTY',        label: 'Party' },
    { value: 'SPORTS',       label: 'Sports' },
    { value: 'SEMINAR',      label: 'Seminar' },
    { value: 'OTHER',        label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-[#71717a] text-sm mt-0.5">Browse and manage events</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search events…"
            className="input pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="input w-full sm:w-48"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-[#1C2230] rounded-t-2xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[#1C2230] rounded w-3/4" />
                <div className="h-3 bg-[#1C2230] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-[#3f3f46] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No events found</h3>
          <p className="text-[#71717a] mt-1 text-sm">
            {search ? 'Try a different search term' : 'No events have been created yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <EventCard event={event} onRefresh={fetchEvents} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary">
            Previous
          </button>
          <span className="text-sm text-[#71717a]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary">
            Next
          </button>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <CreateEventModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { setShowCreateModal(false); fetchEvents(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
