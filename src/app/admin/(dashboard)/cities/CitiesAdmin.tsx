"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { createCityAction, deleteCityAction, updateCityAction } from "@/app/admin/actions";
import type { CityRecord } from "@/lib/data/cities";

export function CitiesAdmin({ cities }: { cities: CityRecord[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addPending, startAddTransition] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [rowPending, startRowTransition] = useTransition();

  function handleAdd() {
    const cleanName = name.trim();
    const cleanCode = code.trim();
    if (!cleanName || !cleanCode) return;
    setAddError(null);
    startAddTransition(async () => {
      try {
        await createCityAction(cleanName, cleanCode);
        setName("");
        setCode("");
        router.refresh();
      } catch (e) {
        setAddError(e instanceof Error ? e.message : "Could not add city.");
      }
    });
  }

  function handleSaveEdit(id: string, newName: string, newCode: string) {
    setRowError(null);
    startRowTransition(async () => {
      try {
        await updateCityAction(id, { name: newName, code: newCode });
        setEditingId(null);
        router.refresh();
      } catch (e) {
        setRowError({ id, message: e instanceof Error ? e.message : "Could not save changes." });
      }
    });
  }

  function handleDelete(city: CityRecord) {
    if (!window.confirm(`Delete "${city.name} (${city.code})"? This cannot be undone.`)) return;
    setRowError(null);
    setDeletingId(city.id);
    startRowTransition(async () => {
      try {
        await deleteCityAction(city.id);
        router.refresh();
      } catch (e) {
        setRowError({
          id: city.id,
          message: e instanceof Error ? e.message : "Could not delete city.",
        });
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <div>
      {/* Add form */}
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
        <div className="flex flex-wrap gap-3">
          <label className="w-full sm:w-64">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              City name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quetta"
              className={inputClass}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </label>
          <label className="w-24">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Code
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="UET"
              maxLength={4}
              className={clsx(inputClass, "text-center uppercase")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </label>
        </div>

        {/* On its own row, aligned under the fields, so it never crowds the code field's focus ring. */}
        <div className="mt-3 flex border-t border-outline-variant/30 pt-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={addPending || !name.trim() || !code.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-4 py-2.5 text-sm font-semibold text-on-secondary-fixed transition-all hover:brightness-105 disabled:opacity-50"
          >
            {addPending ? (
              <Icon name="progress_activity" className="animate-spin text-base" />
            ) : (
              <Icon name="add" className="text-base" />
            )}
            Add City
          </button>
        </div>
        {addError && <p className="mt-2 text-xs text-error">{addError}</p>}
      </div>

      {/* List */}
      <div className="mt-4 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
        {cities.length === 0 ? (
          <p className="p-8 text-center text-sm text-on-surface-variant">
            No cities yet — add one above.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {cities.map((city) => {
              const isEditing = editingId === city.id;
              return (
                <CityRow
                  // Remount on edit-mode toggle so the row's local input state
                  // always starts from the current (possibly just-saved) values.
                  key={`${city.id}-${isEditing ? "edit" : "view"}`}
                  city={city}
                  isEditing={isEditing}
                  isDeleting={rowPending && deletingId === city.id}
                  error={rowError?.id === city.id ? rowError.message : null}
                  pending={rowPending}
                  onEdit={() => setEditingId(city.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(newName, newCode) => handleSaveEdit(city.id, newName, newCode)}
                  onDelete={() => handleDelete(city)}
                />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function CityRow({
  city,
  isEditing,
  isDeleting,
  error,
  pending,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  city: CityRecord;
  isEditing: boolean;
  isDeleting: boolean;
  error: string | null;
  pending: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (name: string, code: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(city.name);
  const [code, setCode] = useState(city.code);

  if (isEditing) {
    return (
      <li className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={clsx(inputClass, "min-w-[160px] flex-1")}
            autoFocus
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            className={clsx(inputClass, "w-20 text-center uppercase")}
          />
          <button
            type="button"
            onClick={() => onSave(name, code)}
            disabled={pending || !name.trim() || !code.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-secondary-fixed px-3 py-1.5 text-xs font-semibold text-on-secondary-fixed disabled:opacity-50"
          >
            {pending ? (
              <Icon name="progress_activity" className="animate-spin text-sm" />
            ) : (
              <Icon name="check" className="text-sm" />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-md px-2 py-1.5 text-xs text-on-surface-variant hover:text-on-surface"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 min-w-14 items-center justify-center rounded-md bg-secondary-container px-2 text-xs font-bold tracking-wide text-on-secondary-container">
            {city.code}
          </span>
          <span className="text-sm font-medium text-on-surface">{city.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Edit city"
            className="flex h-8 w-8 items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary-container/40"
          >
            <Icon name="edit" className="text-base" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            title="Delete city"
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
      {error && <p className="text-xs text-error">{error}</p>}
    </li>
  );
}

const inputClass =
  "rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";
