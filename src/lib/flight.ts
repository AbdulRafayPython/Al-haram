/**
 * Shared flight time / number helpers for the admin package wizard (client)
 * and the server actions. Keeping the rules here means the two can't drift.
 */

export interface FlightFields {
  outboundNo: string | null;
  inboundNo: string | null;
  outboundTime: string | null;
  inboundTime: string | null;
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

/** Format a stored time ("HH:MM" or legacy "h:mm AM") for display, e.g. "5:15 AM". */
export function formatClock(value: string | null | undefined): string {
  const mins = parseTimeToMinutes(value);
  if (mins == null) return value?.trim() ?? "";
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const meridiem = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${meridiem}`;
}

const MIN_GAP_MINUTES = 60;

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

  const dep = parseTimeToMinutes(f.departureTime);
  const ob = parseTimeToMinutes(f.outboundTime);
  const arr = parseTimeToMinutes(f.arrivalTime);
  const ib = parseTimeToMinutes(f.inboundTime);

  // Outbound leg: departure vs check-in.
  if (dep != null && ob != null) {
    if (dep === ob) {
      issues.push({
        code: "outbound-equal",
        message: "Departure time and outbound check-in time cannot be the same.",
        kind: "block",
      });
    } else if (Math.abs(dep - ob) < MIN_GAP_MINUTES) {
      issues.push({
        code: "outbound-gap",
        message: "Departure and outbound check-in times must be at least 1 hour apart.",
        kind: "block",
      });
    }
  }

  // Inbound leg: arrival vs check-in.
  if (arr != null && ib != null) {
    if (arr === ib) {
      issues.push({
        code: "inbound-equal",
        message: "Arrival time and inbound check-in time cannot be the same.",
        kind: "block",
      });
    } else if (Math.abs(arr - ib) < MIN_GAP_MINUTES) {
      issues.push({
        code: "inbound-gap",
        message: "Arrival and inbound check-in times must be at least 1 hour apart.",
        kind: "block",
      });
    }
  }

  // Cross-leg identical check-in times — usually a copy/paste slip.
  if (ob != null && ib != null && ob === ib) {
    issues.push({
      code: "times-equal",
      message: "Outbound and inbound check-in times are identical — double-check.",
      kind: "override",
    });
  }

  return issues;
}

export function getBlockingFlightIssues(f: FlightFields): FlightIssue[] {
  return getFlightIssues(f).filter((i) => i.kind === "block");
}
