'use client';

import { useCallback, useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  /** Whether there are more items to load. */
  hasMore: boolean;
  /** True while a page is currently being fetched. */
  loading: boolean;
  /** Called when the sentinel scrolls into view and a load should start. */
  onLoadMore: () => void;
  /** Distance (px) from the viewport at which to pre-fetch. Default 600. */
  rootMargin?: number;
}

/**
 * Triggers `onLoadMore` when the returned sentinel ref scrolls near the
 * viewport. Uses the native IntersectionObserver — no external dependency,
 * no scroll listeners, and it cleanly re-binds whenever the callback changes.
 *
 * Usage:
 *   const sentinelRef = useInfiniteScroll({ hasMore, loading, onLoadMore });
 *   ...
 *   <div ref={sentinelRef} />
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  hasMore,
  loading,
  onLoadMore,
  rootMargin = 600,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Keep the latest callback/flags without re-creating the observer each render.
  const savedOnLoadMore = useRef(onLoadMore);
  const savedHasMore = useRef(hasMore);
  const savedLoading = useRef(loading);

  useEffect(() => {
    savedOnLoadMore.current = onLoadMore;
    savedHasMore.current = hasMore;
    savedLoading.current = loading;
  }, [onLoadMore, hasMore, loading]);

  // Callback ref: (dis)connects the observer as the sentinel mounts/unmounts.
  const sentinelRef = useCallback(
    (node: T | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (
            entry.isIntersecting &&
            savedHasMore.current &&
            !savedLoading.current
          ) {
            savedOnLoadMore.current();
          }
        },
        { rootMargin: `0px 0px ${rootMargin}px 0px`, threshold: 0 }
      );

      observerRef.current.observe(node);
    },
    [rootMargin]
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return sentinelRef;
}
