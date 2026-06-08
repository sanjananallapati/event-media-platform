'use client';

/** Shimmering placeholder shown while the first page of the feed loads. */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full shimmer-bg" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-32 rounded shimmer-bg" />
              <div className="h-2.5 w-20 rounded shimmer-bg" />
            </div>
          </div>
          <div className="h-72 shimmer-bg" />
          <div className="px-4 py-4 space-y-2.5">
            <div className="flex gap-5">
              <div className="h-6 w-6 rounded-full shimmer-bg" />
              <div className="h-6 w-6 rounded-full shimmer-bg" />
              <div className="h-6 w-6 rounded-full shimmer-bg" />
            </div>
            <div className="h-3 w-16 rounded shimmer-bg" />
            <div className="h-3 w-3/4 rounded shimmer-bg" />
            <div className="h-3 w-1/3 rounded shimmer-bg" />
          </div>
        </div>
      ))}
    </>
  );
}
