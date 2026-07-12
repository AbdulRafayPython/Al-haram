const stepLabels = ["Route & Airline", "Hotels & Stay", "Flight Details", "Pricing & Seats", "Review"];

/** Shared instant placeholder for the package wizard while the route streams in. */
export function WizardSkeleton() {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-5 md:p-7">
      {/* Progress dots */}
      <div className="flex flex-wrap gap-2">
        {stepLabels.map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
              i === 0 ? "bg-secondary-container" : "bg-surface-container"
            }`}
          >
            <div className="h-5 w-5 animate-pulse rounded-full bg-surface-container-high" />
            <div className="hidden h-3 w-24 animate-pulse rounded bg-surface-container-high sm:block" />
          </div>
        ))}
      </div>

      {/* Fields */}
      <div className="mt-8 grid min-h-[320px] gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-surface-container" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-surface-container" />
          </div>
        ))}
      </div>

      {/* Footer buttons */}
      <div className="mt-8 flex items-center justify-between border-t border-outline-variant pt-5">
        <div className="h-10 w-24 animate-pulse rounded-lg bg-surface-container" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-surface-container-high" />
      </div>
    </div>
  );
}
