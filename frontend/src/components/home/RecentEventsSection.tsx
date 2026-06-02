'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { EventCard } from '@/components/events/EventCard';
import { ArrowRight } from 'lucide-react';

export function RecentEventsSection() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events', { params: { limit: 6 } });
      setEvents(response.data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-secondary-50 dark:bg-secondary-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-secondary-200 dark:bg-secondary-700 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4" />
                  <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) return null;

  return (
    <section className="py-20 bg-secondary-50 dark:bg-secondary-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold">Recent Events</h2>
            <p className="text-secondary-500 mt-1">Discover the latest events and photos</p>
          </div>
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            View all events
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/events" className="btn-primary">
            View all events
          </Link>
        </div>
      </div>
    </section>
  );
}
