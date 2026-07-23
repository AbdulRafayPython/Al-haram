/**
 * Server-only fetch for the package scraper.
 *
 * The URL comes from an admin, but "fetch whatever URL you're given" is still an
 * SSRF footgun, so this guards against non-public targets (localhost, private /
 * link-local / loopback IPs, cloud metadata endpoints), caps time and size, and
 * only accepts HTML. Kept out of scrapePackage.ts so that module stays pure and
 * unit-testable.
 */
import "server-only";
import dns from "node:dns/promises";
import net from "node:net";

const TIMEOUT_MS = 12_000;
const MAX_BYTES = 2_500_000;

export interface FetchedPage {
  html: string;
  finalUrl: string;
}

function ipIsPrivate(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) {
    const p = ip.split(".").map(Number);
    if (p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = p;
    if (a === 0 || a === 10 || a === 127) return true; // this-host, private, loopback
    if (a === 169 && b === 254) return true; // link-local (incl. 169.254.169.254 metadata)
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (kind === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true; // loopback / unspecified
    if (v.startsWith("fe80") || v.startsWith("fc") || v.startsWith("fd")) return true; // link-local / ULA
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
    if (mapped) return ipIsPrivate(mapped[1]);
    return false;
  }
  return true; // unparseable → treat as unsafe
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("That host isn't publicly reachable.");
  }
  if (net.isIP(host)) {
    if (ipIsPrivate(host)) throw new Error("That address isn't a public host.");
    return;
  }
  let addrs: { address: string }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("Could not resolve that host name.");
  }
  if (addrs.length === 0 || addrs.some((a) => ipIsPrivate(a.address))) {
    throw new Error("That host resolves to a non-public address.");
  }
}

/** Fetch a public HTML page with SSRF, timeout, size, and content-type guards. */
export async function fetchPage(rawUrl: string): Promise<FetchedPage> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error("Enter a valid URL, including https://");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http:// and https:// URLs are supported.");
  }
  await assertPublicHost(url.hostname);

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; SastaTravelsBot/1.0)",
        accept: "text/html,application/xhtml+xml,text/plain",
      },
    });
  } catch (e) {
    const msg = e instanceof Error && e.name === "TimeoutError" ? "the page took too long to respond" : "network error";
    throw new Error(`Could not fetch that page (${msg}).`);
  }

  if (!res.ok) throw new Error(`The page returned ${res.status}${res.statusText ? ` ${res.statusText}` : ""}.`);

  const ctype = res.headers.get("content-type") ?? "";
  if (ctype && !/(text\/html|application\/xhtml|text\/plain)/i.test(ctype)) {
    throw new Error(`That URL isn't an HTML page (it's ${ctype.split(";")[0].trim()}).`);
  }

  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf).subarray(0, MAX_BYTES);
  const html = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (!html.trim()) throw new Error("The page came back empty.");
  return { html, finalUrl: res.url || url.toString() };
}
