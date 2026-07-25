/**
 * Shared loading state for every admin page that doesn't define its own.
 *
 * The admin pages are `force-dynamic`, so each tab switch waits on a live query
 * (~220 ms round trip to Supabase). Without a loading boundary the router holds
 * the *previous* page on screen for that whole time and the click feels dead;
 * with one, navigation paints instantly and streams the real content in.
 */
export default function Loading() {
  return (
    <div>
      <div className="h-8 w-56 animate-pulse rounded bg-surface-container" />
      <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-surface-container" />

      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
        <div className="border-b border-outline-variant/40 bg-surface-container px-5 py-3.5">
          <div className="h-3 w-40 animate-pulse rounded bg-surface-container-high" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-outline-variant/30 px-5 py-4 last:border-0"
          >
            <div className="h-4 flex-1 animate-pulse rounded bg-surface-container" />
            <div className="hidden h-4 w-32 animate-pulse rounded bg-surface-container sm:block" />
            <div className="hidden h-4 w-24 animate-pulse rounded bg-surface-container md:block" />
            <div className="h-4 w-16 animate-pulse rounded bg-surface-container" />
          </div>
        ))}
      </div>
    </div>
  );
}
