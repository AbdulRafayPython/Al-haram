# Site audio

## `talbiyah.mp3`

The floating **Talbiyah** panel (`web/src/components/layout/Talbiyah.tsx`) plays this file, configured
as `site.talbiyahAudioSrc` in `web/src/data/site.ts`.

Current file: a "Labbaik Allahuma Labbaik" recitation, 192 kbps / 44.1 kHz stereo, ~1:53, 2.6 MB.
It was supplied with a long Arabic filename containing spaces and **renamed to `talbiyah.mp3`** —
keep that name. A non-ASCII path with spaces has to be percent-encoded to work as a URL and breaks
differently across browsers and hosts; the plain name avoids the whole class of problem.

If you swap the file:

- Keep the filename `talbiyah.mp3`, or change `site.talbiyahAudioSrc` to match.
- It loops, so a clean loop point is worth having — it now plays unprompted on most visits, so a
  jarring seam will be heard often.
- Keep it modest in size. Only metadata is preloaded and the rest streams over range requests, but a
  few MB is plenty.
- The player forces volume to ~12% and fades in over 2.5 s, so master at a normal level — don't
  pre-quieten or pre-fade the file.
- It starts on its own where the browser allows, and otherwise on the visitor's first click or tap.
  It can never play with sound before some interaction — no browser permits that.

If the file is ever removed, nothing breaks: the `<audio>` error handler hides the sound control and
the panel falls back to showing the Talbiyah text, transliteration and translation only.
