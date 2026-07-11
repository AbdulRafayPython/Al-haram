"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { deletePackageAction, togglePublishAction } from "@/app/admin/actions";

export function PackageRowActions({
  id,
  title,
  isPublished,
}: {
  id: string;
  title: string;
  isPublished: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => togglePublishAction(id, !isPublished))}
        title={isPublished ? "Hide from live board" : "Publish to live board"}
        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
      >
        <Icon name={isPublished ? "visibility" : "visibility_off"} className="text-base" />
        {isPublished ? "Live" : "Hidden"}
      </button>
      <Link
        href={`/admin/packages/${id}/edit`}
        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-secondary transition-colors hover:bg-secondary-container/40"
      >
        <Icon name="edit" className="text-base" />
        Edit
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
          startTransition(() => deletePackageAction(id));
        }}
        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-50"
      >
        <Icon name="delete" className="text-base" />
        Delete
      </button>
    </div>
  );
}
