'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { MediaGrid } from '@/components/media/MediaGrid';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FavouritesPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFavourites();
  }, [page]);

  const fetchFavourites = async () => {
    try {
      const response = await api.get('/media/favourites', {
        params: { page, limit: 20 },
      });
      setMedia(response.data.data);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch favourites');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Favourites</h1>
        <p className="text-secondary-500">Your saved photos and videos</p>
      </div>

      {media.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-12 text-center"
        >
          <Heart className="w-12 h-12 mx-auto text-secondary-400 mb-4" />
          <h3 className="text-lg font-medium">No favourites yet</h3>
          <p className="text-secondary-500 mt-1">
            Start saving photos you like by clicking the bookmark icon
          </p>
        </motion.div>
      ) : (
        <>
          <MediaGrid media={media} onRefresh={fetchFavourites} />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <span className="text-sm text-secondary-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
