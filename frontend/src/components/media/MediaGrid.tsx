'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Eye, Play } from 'lucide-react';

interface MediaGridProps {
  media: any[];
  onRefresh?: () => void;
}

export function MediaGrid({ media, onRefresh }: MediaGridProps) {
  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">No media found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {media.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02 }}
        >
          <Link
            href={`/dashboard/media/${item.id}`}
            className="block relative group aspect-square rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-700"
          >
            {item.type === 'VIDEO' ? (
              <>
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.caption || item.originalName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={item.thumbnailUrl || item.url}
                alt={item.caption || item.originalName}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-3 text-white text-sm">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {item._count?.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {item.viewCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Similarity badge for face search results */}
            {item.similarity && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded bg-primary-600 text-white text-xs font-medium">
                {Math.round(item.similarity)}% match
              </div>
            )}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
