"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { site } from "@/data/site";

/**
 * Floating Talbiyah panel — an elegant display of the Talbiyah with soft
 * recitation playing underneath it.
 *
 * Audio starts on its own, as far as the browser allows. Every current browser
 * refuses `play()` with sound until the visitor has interacted with the site,
 * and no amount of code changes that — so this does two things in order:
 *
 *   1. Try to play immediately on mount. This succeeds where the browser
 *      already trusts the origin (a return visitor, high media engagement,
 *      installed PWA).
 *   2. If it's refused, arm the *first* real gesture (pointer/key/touch) and
 *      start then. From the visitor's side it still begins by itself — they
 *      never press play — it just waits for their first click or tap.
 *
 * It always fades in from silence rather than cutting in, and runs at a low
 * fixed volume, so an unannounced start is calm rather than startling. Sound is
 * opt-OUT: it plays unless the visitor has switched it off, and that choice is
 * remembered across visits.
 *
 * If the audio file isn't deployed (see site.talbiyahAudioSrc), the <audio>
 * error handler hides the sound control entirely and the panel degrades to the
 * text display alone.
 */

/* Versioned key. An earlier build wrote "off" whenever a play attempt failed —
   including attempts the browser refused for want of a gesture — which then
   permanently suppressed auto-start for that visitor with no way to tell. Those
   stale values must not be honoured, so this reads a fresh key; only a
   deliberate switch-off writes to it now. */
const STORAGE_KEY = "ste:talbiyah-audio:v2";
/** Low by design — background presence, never competing with the page. */
const VOLUME = 0.12;
/** Ease up from silence so a start the visitor didn't ask for never jars. */
const FADE_MS = 2500;

export function Talbiyah() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const fadeRef = useRef<number | null>(null);

  const stopFade = useCallback(() => {
    if (fadeRef.current !== null) {
      window.clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  }, []);

  const fadeIn = useCallback(
    (el: HTMLAudioElement) => {
      stopFade();
      const startedAt = Date.now();
      el.volume = 0;
      fadeRef.current = window.setInterval(() => {
        const progress = Math.min(1, (Date.now() - startedAt) / FADE_MS);
        el.volume = VOLUME * progress;
        if (progress >= 1) stopFade();
      }, 50);
    },
    [stopFade],
  );

  const startAudio = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return false;
    // Already sounding — don't restart it (that would reset the fade to silence).
    // Makes this safe to call twice, which the two racing start paths below do.
    if (!el.paused) {
      setPlaying(true);
      return true;
    }
    try {
      el.volume = 0;
      await el.play();
      fadeIn(el);
      setPlaying(true);
      return true;
    } catch {
      // Refused for want of a gesture, or the file is missing. Either way stay
      // quiet — the caller decides whether to retry behind a real interaction.
      stopFade();
      el.volume = VOLUME;
      setPlaying(false);
      return false;
    }
  }, [fadeIn, stopFade]);

  // Start by itself unless the visitor has switched sound off.
  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === "off") return;

    let cancelled = false;
    // Capture phase: a gesture must reach us even if a handler on the way down
    // stops propagation.
    const opts = { capture: true } as const;
    const events = ["pointerdown", "keydown", "touchstart"] as const;

    const arm = () => {
      detach();
      void startAudio();
    };
    const attach = () => events.forEach((e) => document.addEventListener(e, arm, opts));
    const detach = () => events.forEach((e) => document.removeEventListener(e, arm, opts));

    // Arm the gesture fallback FIRST, then race the eager attempt against it.
    // Order matters: the eager attempt is asynchronous, and if we only started
    // listening after it rejected, a visitor who clicked inside that window
    // would have their one gesture swallowed and hear nothing at all.
    // (`scroll` is deliberately not in the list — it isn't a user activation,
    // so it can never unblock audio.)
    attach();

    // Deferred a tick only so the effect body itself stays free of state
    // updates. Succeeds where the browser already trusts this origin.
    const kickoff = window.setTimeout(() => {
      void startAudio().then((started) => {
        if (started && !cancelled) detach();
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(kickoff);
      detach();
    };
  }, [startAudio]);

  // Never leave a fade timer running past unmount.
  useEffect(() => stopFade, [stopFade]);

  // Close the panel on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggleAudio() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      stopFade();
      el.pause();
      setPlaying(false);
      // An explicit switch-off sticks — no auto-start on the next visit either.
      window.localStorage.setItem(STORAGE_KEY, "off");
      return;
    }
    // This runs from a click, so the browser will honour it.
    await startAudio();
    window.localStorage.setItem(STORAGE_KEY, "on");
  }

  return (
    <div ref={panelRef} className="fixed bottom-6 left-4 z-50 sm:left-6">
      {/* Panel */}
      <div
        id="talbiyah-panel"
        hidden={!open}
        className={clsx(
          "mb-3 w-[min(20rem,calc(100vw-2rem))] origin-bottom-left rounded-xl border border-secondary/25",
          "bg-surface-container-lowest/95 p-5 shadow-2xl backdrop-blur-md",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-script)] text-xl text-secondary">Talbiyah</p>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-on-surface-variant">
              The call of the pilgrim
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close Talbiyah"
            className="-mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
          >
            <Icon name="close" className="text-base" />
          </button>
        </div>

        <p
          lang="ar"
          dir="rtl"
          className="mt-4 font-[family-name:var(--font-arabic)] text-xl leading-[2.1] text-on-surface"
        >
          لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ
          وَالْمُلْكَ، لَا شَرِيكَ لَكَ
        </p>

        <p className="mt-3 text-xs italic leading-relaxed text-secondary/90">
          Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni&apos;mata laka
          wal-mulk, la sharika lak.
        </p>

        <p className="mt-3 border-t border-outline-variant/40 pt-3 text-xs leading-relaxed text-on-surface-variant">
          &ldquo;Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Truly all praise,
          favour and sovereignty are Yours. You have no partner.&rdquo;
        </p>

        {audioAvailable && (
          <button
            type="button"
            onClick={toggleAudio}
            aria-pressed={playing}
            className={clsx(
              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5",
              "text-xs font-semibold uppercase tracking-widest transition-all",
              playing
                ? "bg-secondary-fixed text-on-secondary-fixed hover:brightness-105"
                : "border border-secondary/50 text-secondary hover:bg-secondary/10",
            )}
          >
            <Icon name={playing ? "pause" : "play_arrow"} className="text-base" />
            {playing ? "Pause Talbiyah" : "Play softly"}
          </button>
        )}
        {audioAvailable && (
          <p className="mt-2 text-center text-[0.65rem] text-on-surface-variant">
            Begins softly on its own. Turn it off here and it stays off.
          </p>
        )}
      </div>

      {/* Trigger. Because the audio can start unprompted, muting it must be one
          click from anywhere — not two via the panel — so the mute sits out here
          alongside the pill whenever sound is actually playing. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="talbiyah-panel"
          title="Talbiyah"
          className={clsx(
            "flex h-14 items-center gap-2 rounded-full border border-secondary/40 bg-tertiary/90 px-4",
            "text-secondary shadow-2xl backdrop-blur-md transition-transform hover:scale-105",
          )}
        >
          <Icon
            name={playing ? "graphic_eq" : "mosque"}
            className={clsx("text-2xl", playing && "flash-banner-blink")}
          />
          <span className="font-[family-name:var(--font-script)] text-lg leading-none">Talbiyah</span>
        </button>

        {audioAvailable && playing && (
          <button
            type="button"
            onClick={toggleAudio}
            aria-label="Mute Talbiyah audio"
            title="Mute"
            className={clsx(
              "flex h-11 w-11 items-center justify-center rounded-full border border-secondary/40",
              "bg-tertiary/90 text-secondary shadow-2xl backdrop-blur-md transition-transform hover:scale-105",
            )}
          >
            <Icon name="volume_off" className="text-xl" />
          </button>
        )}
      </div>

      {/* Ambient recitation — no dialogue to caption. */}
      <audio
        ref={audioRef}
        src={site.talbiyahAudioSrc}
        loop
        // "metadata", not "auto": now that playback is expected on most visits a
        // cold start on play() is worth avoiding, but pulling the whole 2.6 MB
        // on every page load is not — it streams over range requests instead.
        preload="metadata"
        onError={() => {
          setAudioAvailable(false);
          setPlaying(false);
        }}
      />
    </div>
  );
}
