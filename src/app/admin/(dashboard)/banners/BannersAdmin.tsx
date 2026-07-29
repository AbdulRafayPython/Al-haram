"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { FlashBanner } from "@/components/layout/FlashBanner";
import {
  createBannerAction,
  deleteBannerAction,
  removeBannerImageAction,
  toggleBannerAction,
  updateBannerAction,
  uploadBannerImageAction,
  type BannerFormInput,
} from "@/app/admin/actions";
import {
  BANNER_VARIANTS,
  MAX_HIGHLIGHTS,
  MAX_HIGHLIGHT_LENGTH,
  bannerVariantLabels as variantLabels,
  type BannerVariant,
  type PromoBanner,
} from "@/data/banners";

/**
 * Flash-banner manager. Campaign content is data, so this page is the whole
 * "future campaign" workflow: write copy, pick a style, switch it on.
 */

const emptyForm: BannerFormInput = {
  label: "",
  title: "",
  highlights: [],
  message: "",
  ctaLabel: "",
  ctaHref: "",
  variant: "gold",
  isFlashing: true,
  isActive: false,
  startsAt: "",
  endsAt: "",
  sortOrder: 0,
};

/** Copy-and-go starting points; the admin edits the text before saving. */
const presets: { name: string; icon: string; form: Partial<BannerFormInput> }[] = [
  {
    name: "Limited Time Offer",
    icon: "bolt",
    form: {
      label: "Limited Time Offer",
      title: "Save On Every Umrah Seat",
      message: "Book your Umrah package this week and travel with our best rates of the season.",
      highlights: ["Verified Hotels", "Direct Flights", "Visa Included"],
      ctaLabel: "View Packages",
      ctaHref: "/",
      variant: "gold",
    },
  },
  {
    name: "New Packages Available",
    icon: "new_releases",
    form: {
      label: "Just Added",
      title: "New Ramadan Departures",
      message: "Fresh Ramadan groups are now open for booking, with limited seats per departure.",
      highlights: ["Ramadan 2026", "Limited Seats"],
      ctaLabel: "See Departures",
      ctaHref: "/",
      variant: "navy",
    },
  },
  {
    name: "Free Visa Processing",
    icon: "verified",
    form: {
      label: "Included",
      title: "Free Visa Processing",
      message: "Visa processing is on us for every group package booked this month.",
      highlights: ["No Hidden Fees", "Fast Processing"],
      ctaLabel: "Enquire Now",
      ctaHref: "/contact",
      variant: "dark",
    },
  },
];

/** ISO instant → the "YYYY-MM-DDTHH:mm" a datetime-local input expects, in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

function toForm(banner: PromoBanner): BannerFormInput {
  return {
    label: banner.label ?? "",
    title: banner.title ?? "",
    highlights: banner.highlights,
    message: banner.message,
    ctaLabel: banner.ctaLabel ?? "",
    ctaHref: banner.ctaHref ?? "",
    variant: banner.variant,
    isFlashing: banner.isFlashing,
    isActive: banner.isActive,
    startsAt: toLocalInput(banner.startsAt),
    endsAt: toLocalInput(banner.endsAt),
    sortOrder: banner.sortOrder,
  };
}

/** Switched on AND inside its schedule window — i.e. what the public sees right now. */
function isLiveNow(banner: PromoBanner): boolean {
  if (!banner.isActive) return false;
  const now = Date.now();
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) return false;
  if (banner.endsAt && new Date(banner.endsAt).getTime() <= now) return false;
  return true;
}

export function BannersAdmin({ banners }: { banners: PromoBanner[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<BannerFormInput>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Only the first live banner is actually rendered publicly (lowest sort order).
  const liveId = useMemo(() => banners.find(isLiveNow)?.id ?? null, [banners]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setCreating(true);
    setFormError(null);
  }

  function openEdit(banner: PromoBanner) {
    setForm(toForm(banner));
    setEditingId(banner.id);
    setCreating(false);
    setFormError(null);
  }

  function closeForm() {
    setCreating(false);
    setEditingId(null);
    setFormError(null);
  }

  function handleSave() {
    setFormError(null);
    startTransition(async () => {
      try {
        const result = editingId
          ? await updateBannerAction(editingId, form)
          : await createBannerAction(form);
        if (!result.ok) {
          setFormError(result.error);
          return;
        }
        closeForm();
        router.refresh();
      } catch {
        // Only a genuine crash lands here — the actions return their validation
        // messages rather than throwing, because a thrown message is redacted
        // in production builds.
        setFormError("Something went wrong saving the banner. Please try again.");
      }
    });
  }

  function handleToggle(banner: PromoBanner) {
    setRowError(null);
    setBusyId(banner.id);
    startTransition(async () => {
      try {
        const result = await toggleBannerAction(banner.id, !banner.isActive);
        if (!result.ok) setRowError({ id: banner.id, message: result.error });
        else router.refresh();
      } catch {
        setRowError({ id: banner.id, message: "Could not change the banner. Please try again." });
      } finally {
        setBusyId(null);
      }
    });
  }

  function handleDelete(banner: PromoBanner) {
    if (!window.confirm(`Delete the banner "${banner.message}"? This cannot be undone.`)) return;
    setRowError(null);
    setBusyId(banner.id);
    startTransition(async () => {
      try {
        const result = await deleteBannerAction(banner.id);
        if (!result.ok) {
          setRowError({ id: banner.id, message: result.error });
          return;
        }
        if (editingId === banner.id) closeForm();
        router.refresh();
      } catch {
        setRowError({ id: banner.id, message: "Could not delete the banner. Please try again." });
      } finally {
        setBusyId(null);
      }
    });
  }

  const formOpen = creating || editingId !== null;

  return (
    <div className="space-y-4">
      {!formOpen && (
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-4 py-2.5 text-sm font-semibold text-on-secondary-fixed transition-all hover:brightness-105"
        >
          <Icon name="add" className="text-base" />
          New Banner
        </button>
      )}

      {formOpen && (
        <BannerForm
          form={form}
          setForm={setForm}
          isEditing={editingId !== null}
          editingBanner={banners.find((b) => b.id === editingId) ?? null}
          onImageChanged={() => router.refresh()}
          pending={pending}
          error={formError}
          onSave={handleSave}
          onCancel={closeForm}
          onPreset={(preset) => setForm((f) => ({ ...f, ...preset }))}
        />
      )}

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
        {banners.length === 0 ? (
          <p className="p-8 text-center text-sm text-on-surface-variant">
            No banners yet — create one above and switch it on when the campaign starts.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {banners.map((banner) => (
              <li key={banner.id} className="px-4 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {banner.id === liveId ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          Live on site
                        </span>
                      ) : banner.isActive ? (
                        <span
                          className="rounded-full bg-secondary-container px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-on-secondary-container"
                          title="On, but not showing — it's outside its schedule, or another banner is ahead of it in sort order."
                        >
                          On (queued)
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-container px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">
                          Off
                        </span>
                      )}
                      {banner.label && (
                        <span className="text-xs font-semibold text-secondary">{banner.label}</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-on-surface">{banner.message}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {variantLabels[banner.variant]}
                      {banner.isFlashing ? " · flashing" : " · static"}
                      {banner.ctaLabel ? ` · button "${banner.ctaLabel}"` : ""}
                      {` · order ${banner.sortOrder}`}
                      {banner.startsAt || banner.endsAt
                        ? ` · ${formatWindow(banner.startsAt, banner.endsAt)}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggle(banner)}
                      disabled={busyId === banner.id}
                      title={banner.isActive ? "Switch off" : "Switch on"}
                      className={clsx(
                        "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                        banner.isActive
                          ? "bg-success/15 text-success hover:bg-success/25"
                          : "bg-surface-container text-on-surface-variant hover:text-on-surface",
                      )}
                    >
                      {busyId === banner.id ? (
                        <Icon name="progress_activity" className="animate-spin text-sm" />
                      ) : (
                        <Icon
                          name={banner.isActive ? "toggle_on" : "toggle_off"}
                          className="text-base"
                        />
                      )}
                      {banner.isActive ? "On" : "Off"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(banner)}
                      title="Edit banner"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary-container/40"
                    >
                      <Icon name="edit" className="text-base" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(banner)}
                      disabled={busyId === banner.id}
                      title="Delete banner"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                    >
                      <Icon name="delete" className="text-base" />
                    </button>
                  </div>
                </div>
                {rowError?.id === banner.id && (
                  <p className="mt-1.5 text-xs text-error">{rowError.message}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatWindow(startsAt: string | null, endsAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  if (startsAt && endsAt) return `${fmt(startsAt)} → ${fmt(endsAt)}`;
  if (startsAt) return `from ${fmt(startsAt)}`;
  return `until ${fmt(endsAt!)}`;
}

function BannerForm({
  form,
  setForm,
  isEditing,
  editingBanner,
  onImageChanged,
  pending,
  error,
  onSave,
  onCancel,
  onPreset,
}: {
  form: BannerFormInput;
  setForm: React.Dispatch<React.SetStateAction<BannerFormInput>>;
  isEditing: boolean;
  editingBanner: PromoBanner | null;
  onImageChanged: () => void;
  pending: boolean;
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
  onPreset: (preset: Partial<BannerFormInput>) => void;
}) {
  const set = <K extends keyof BannerFormInput>(key: K, value: BannerFormInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const imageUrl = editingBanner?.imageUrl ?? null;

  // A button needs both halves. Catching it here — at the field, as they type —
  // beats a round trip that comes back with a form-level error.
  const hasCtaLabel = Boolean(form.ctaLabel.trim());
  const hasCtaHref = Boolean(form.ctaHref.trim());
  const ctaIncomplete = hasCtaLabel !== hasCtaHref;

  // Shaped like a real banner so the preview renders through the same component
  // the public site uses — what you see here is exactly what ships.
  const previewBanner: PromoBanner = {
    id: "preview",
    label: form.label.trim() || null,
    title: form.title.trim() || null,
    imageUrl: imageUrl ?? null,
    highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
    message: form.message.trim() || "Your announcement text will appear here.",
    ctaLabel: form.ctaLabel.trim() || null,
    ctaHref: form.ctaHref.trim() || null,
    variant: (BANNER_VARIANTS as readonly string[]).includes(form.variant)
      ? (form.variant as BannerVariant)
      : "gold",
    isFlashing: form.isFlashing,
    isActive: form.isActive,
    startsAt: null,
    endsAt: null,
    sortOrder: form.sortOrder,
    updatedAt: "preview",
  };
  // A half-filled CTA would render a dead link — hide it until both parts exist.
  if (!previewBanner.ctaLabel || !previewBanner.ctaHref) {
    previewBanner.ctaLabel = null;
    previewBanner.ctaHref = null;
  }

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface">
          {isEditing ? "Edit banner" : "New banner"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant hover:text-on-surface"
          aria-label="Close form"
        >
          <Icon name="close" className="text-base" />
        </button>
      </div>

      {!isEditing && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-on-surface-variant">Start from a template:</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => onPreset(p.form)}
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary"
              >
                <Icon name={p.icon} className="text-sm" />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live preview */}
      <div className="mt-4 overflow-hidden rounded-lg border border-outline-variant/40">
        <FlashBanner banner={previewBanner} preview />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={labelClass}>
            Message <span className="text-error">*</span>
          </span>
          <input
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            maxLength={200}
            placeholder="Limited time — save on every Umrah seat this week."
            className={inputClass}
            autoFocus
          />
        </label>

        <label className="sm:col-span-2">
          <span className={labelClass}>Headline (optional)</span>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={80}
            placeholder="e.g. 25 Hajees = 1 Free Umrah"
            className={inputClass}
          />
          <span className="mt-1 block text-[0.65rem] text-on-surface-variant">
            The big line on the card. Leave empty and the message carries it alone.
          </span>
        </label>

        <label>
          <span className={labelClass}>Badge (optional)</span>
          <input
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            maxLength={40}
            placeholder="Limited Time Offer"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Style</span>
          <select
            value={form.variant}
            onChange={(e) => set("variant", e.target.value)}
            className={inputClass}
          >
            {BANNER_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {variantLabels[v]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Button text (optional)</span>
          <input
            value={form.ctaLabel}
            onChange={(e) => set("ctaLabel", e.target.value)}
            maxLength={40}
            placeholder="e.g. Book Now"
            className={clsx(inputClass, ctaIncomplete && !hasCtaLabel && "border-error")}
          />
          {ctaIncomplete && !hasCtaLabel && (
            <span className="mt-1 block text-[0.65rem] text-error">
              Add the text to show on the button, or clear the link.
            </span>
          )}
        </label>

        <label>
          <span className={labelClass}>Button link</span>
          <input
            value={form.ctaHref}
            onChange={(e) => set("ctaHref", e.target.value)}
            placeholder="e.g. /contact"
            className={clsx(inputClass, ctaIncomplete && !hasCtaHref && "border-error")}
          />
          {ctaIncomplete && !hasCtaHref && (
            <span className="mt-1 block text-[0.65rem] text-error">
              Where should the button go? Use a site path like /contact, or clear the button text.
            </span>
          )}
        </label>

        <div className="sm:col-span-2">
          <span className={labelClass}>Feature pills (optional)</span>
          <div className="flex flex-wrap gap-2">
            {form.highlights.map((h, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container pl-2.5">
                <input
                  value={h}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      highlights: f.highlights.map((x, xi) => (xi === i ? e.target.value : x)),
                    }))
                  }
                  maxLength={MAX_HIGHLIGHT_LENGTH}
                  placeholder="e.g. Visa Included"
                  className="w-36 bg-transparent py-1.5 text-xs text-on-surface focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Remove pill"
                  onClick={() =>
                    setForm((f) => ({ ...f, highlights: f.highlights.filter((_, xi) => xi !== i) }))
                  }
                  className="px-1.5 text-on-surface-variant hover:text-error"
                >
                  <Icon name="close" className="text-sm" />
                </button>
              </span>
            ))}
            {form.highlights.length < MAX_HIGHLIGHTS && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, highlights: [...f.highlights, ""] }))}
                className="inline-flex items-center gap-1 rounded-lg border border-dashed border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary"
              >
                <Icon name="add" className="text-sm" />
                Add pill
              </button>
            )}
          </div>
          <span className="mt-1 block text-[0.65rem] text-on-surface-variant">
            Up to {MAX_HIGHLIGHTS} short selling points, {MAX_HIGHLIGHT_LENGTH} characters each.
          </span>
        </div>

        <div className="sm:col-span-2">
          <span className={labelClass}>Card image (optional)</span>
          {isEditing && editingBanner ? (
            <BannerImageField
              bannerId={editingBanner.id}
              imageUrl={imageUrl}
              onChanged={onImageChanged}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-outline-variant px-3 py-3 text-xs text-on-surface-variant">
              Create the banner first, then reopen it to add an image.
            </p>
          )}
        </div>

        <label>
          <span className={labelClass}>Show from (optional)</span>
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Hide after (optional)</span>
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Sort order</span>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
            className={inputClass}
          />
          <span className="mt-1 block text-[0.65rem] text-on-surface-variant">
            Lowest number wins when more than one banner is on.
          </span>
        </label>

        <div className="flex flex-col justify-center gap-2 sm:pt-5">
          <label className="flex items-center gap-2 text-sm text-on-surface">
            <input
              type="checkbox"
              checked={form.isFlashing}
              onChange={(e) => set("isFlashing", e.target.checked)}
              className="h-4 w-4 accent-[var(--color-secondary-fixed)]"
            />
            Flashing animation
          </label>
          <label className="flex items-center gap-2 text-sm text-on-surface">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 accent-[var(--color-secondary-fixed)]"
            />
            Show on the website now
          </label>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-error">{error}</p>}

      <div className="mt-4 flex items-center gap-2 border-t border-outline-variant/30 pt-3">
        <button
          type="button"
          onClick={onSave}
          disabled={pending || !form.message.trim() || ctaIncomplete}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-4 py-2.5 text-sm font-semibold text-on-secondary-fixed transition-all hover:brightness-105 disabled:opacity-50"
        >
          {pending ? (
            <Icon name="progress_activity" className="animate-spin text-base" />
          ) : (
            <Icon name="check" className="text-base" />
          )}
          {isEditing ? "Save Changes" : "Create Banner"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2.5 text-sm text-on-surface-variant hover:text-on-surface"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

/**
 * Hero image for the card. Upload needs the banner to exist (the file is keyed
 * by its id), so this only appears when editing a saved banner.
 */
function BannerImageField({
  bannerId,
  imageUrl,
  onChanged,
}: {
  bannerId: string;
  imageUrl: string | null;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadBannerImageAction(bannerId, fd);
      if (!result.ok) setError(result.error);
      else onChanged();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      const result = await removeBannerImageAction(bannerId);
      if (!result.ok) setError(result.error);
      else onChanged();
    } catch {
      setError("Could not remove the image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container p-3">
      <div className="flex items-center gap-3">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-14 w-24 shrink-0 rounded-md object-cover"
          />
        ) : (
          <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-md bg-surface-container-high text-on-surface-variant">
            <Icon name="image" className="text-xl" />
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 text-xs text-on-surface transition-colors hover:border-secondary hover:text-secondary">
            {busy ? (
              <Icon name="progress_activity" className="animate-spin text-sm" />
            ) : (
              <Icon name="upload" className="text-sm" />
            )}
            {imageUrl ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
          </label>
          {imageUrl && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded-md px-2 py-1.5 text-xs text-error hover:bg-error/10 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-[0.65rem] text-on-surface-variant">
        Converted to WebP and cropped to the card. Wide/landscape images work best; under 5 MB.
      </p>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
