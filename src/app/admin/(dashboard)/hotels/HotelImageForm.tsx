"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { removeHotelImageAction, uploadHotelImageAction } from "@/app/admin/actions";

export function HotelImageForm({ hotelId, hasImage }: { hotelId: string; hasImage: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      try {
        await uploadHotelImageAction(hotelId, fd);
        setFileName(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      }
    });
  }

  function onRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await removeHotelImageAction(hotelId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not remove image.");
      }
    });
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:border-secondary">
          <Icon name="upload" className="text-sm" />
          {fileName ? "Change file" : "Choose image"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        <button
          type="button"
          onClick={onUpload}
          disabled={pending || !fileName}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-3 py-1.5 text-xs font-semibold text-on-secondary-fixed transition-all hover:brightness-105 disabled:opacity-50"
        >
          {pending ? <Icon name="progress_activity" className="animate-spin text-sm" /> : <Icon name="save" className="text-sm" />}
          Upload
        </button>
        {hasImage && (
          <button
            type="button"
            onClick={onRemove}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-50"
          >
            <Icon name="delete" className="text-sm" />
            Remove
          </button>
        )}
      </div>
      {fileName && <p className="mt-1.5 truncate text-xs text-on-surface-variant">{fileName}</p>}
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
