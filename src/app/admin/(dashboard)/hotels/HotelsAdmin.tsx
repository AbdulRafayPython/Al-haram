"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { deleteHotelAction } from "@/app/admin/actions";
import { HotelImageForm } from "./HotelImageForm";
import { HotelFormModal } from "./HotelFormModal";
import type { Hotel } from "@/data/types";

export function HotelsAdmin({ hotels }: { hotels: Hotel[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<"add" | Hotel | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSaved() {
    setModal(null);
    router.refresh();
  }

  function handleDelete(hotel: Hotel) {
    if (!window.confirm(`Delete "${hotel.name}"? This cannot be undone.`)) return;
    setDeleteError(null);
    setDeletingId(hotel.id);
    startTransition(async () => {
      try {
        await deleteHotelAction(hotel.id);
        router.refresh();
      } catch (e) {
        setDeleteError({
          id: hotel.id,
          message: e instanceof Error ? e.message : "Could not delete hotel.",
        });
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setModal("add")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-4 py-2.5 text-sm font-semibold text-on-secondary-fixed transition-all hover:brightness-105"
        >
          <Icon name="add" className="text-base" />
          Add Hotel
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {hotels.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">
            No hotels yet — add one above.
          </p>
        )}
        {hotels.map((hotel) => {
          const isDeleting = pending && deletingId === hotel.id;
          return (
            <div
              key={hotel.id}
              className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest"
            >
              <div className="relative aspect-video bg-surface-container">
                {hotel.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hotel.imageUrl} alt={hotel.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-on-surface-variant/60">
                    <Icon name="image" className="text-3xl" />
                    <span className="text-xs">No image yet</span>
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-on-primary">
                  {hotel.city}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-[var(--font-heading)] text-base text-on-surface">
                      {hotel.name}
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-on-surface-variant">{hotel.location}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModal(hotel)}
                      title="Edit hotel"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary-container/40"
                    >
                      <Icon name="edit" className="text-base" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(hotel)}
                      disabled={isDeleting}
                      title="Delete hotel"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Icon name="progress_activity" className="animate-spin text-base" />
                      ) : (
                        <Icon name="delete" className="text-base" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-on-surface-variant">
                  <Icon name="near_me" className="text-sm text-secondary" />
                  {hotel.distance}
                </p>

                {deleteError?.id === hotel.id && (
                  <p className="mt-2 text-xs text-error">{deleteError.message}</p>
                )}

                <div className="mt-auto pt-3">
                  <HotelImageForm hotelId={hotel.id} hasImage={Boolean(hotel.imageUrl)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <HotelFormModal
          hotel={modal === "add" ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
