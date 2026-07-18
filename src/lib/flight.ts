/**
 * Shared flight time / number helpers for the admin package wizard (client)
 * and the server actions. Keeping the rules here means the two can't drift.
 */

export interface FlightFields {
  outboundNo: string | null;
  inboundNo: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
}

export interface FlightIssue {
  code: string;
  message: string;
  /** "block" = must fix before saving; "override" = warn, admin may proceed anyway. */
  kind: "block" | "override";
}

/** Parse "HH:MM" (24h) or "h:mm AM/PM" into minutes since midnight; null if empty/unparseable. */
export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const v = value.trim();
  const m12 = v.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    if (h === 12) h = 0;
    if (/pm/i.test(m12[3])) h += 12;
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }
  const m24 = v.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }
  return null;
}

/** Normalize any accepted time string to "HH:MM" for an <input type="time"> value. */
export function toTimeInputValue(value: string | null | undefined): string {
  const mins = parseTimeToMinutes(value);
  if (mins == null) return "";
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/**
 * Format a stored time ("HH:MM" or legacy "h:mm AM/PM") for display on a
 * 24-hour clock, e.g. "05:15" or "19:20". Legacy 12-hour values are parsed and
 * converted so old records display consistently.
 */
export function formatClock(value: string | null | undefined): string {
  const mins = parseTimeToMinutes(value);
  if (mins == null) return value?.trim() ?? "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** All rule violations for the given flight fields (missing fields are skipped). */
export function getFlightIssues(f: FlightFields): FlightIssue[] {
  const issues: FlightIssue[] = [];

  const ono = f.outboundNo?.trim().toUpperCase();
  const ino = f.inboundNo?.trim().toUpperCase();
  if (ono && ino && ono === ino) {
    issues.push({
      code: "same-flight-no",
      message: "Outbound and inbound flight numbers are the same.",
      kind: "override",
    });
  }

  return issues;
}

export function getBlockingFlightIssues(f: FlightFields): FlightIssue[] {
  return getFlightIssues(f).filter((i) => i.kind === "block");
}
