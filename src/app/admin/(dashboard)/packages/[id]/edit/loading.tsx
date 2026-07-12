import { WizardSkeleton } from "../../WizardSkeleton";

export default function Loading() {
  return (
    <div>
      <div className="h-8 w-64 animate-pulse rounded bg-surface-container" />
      <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-surface-container" />
      <div className="mt-6">
        <WizardSkeleton />
      </div>
    </div>
  );
}
