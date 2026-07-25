/**
 * Dev-server launcher with a sane heap ceiling.
 *
 * Why this exists: `next dev` auto-sets `--max-old-space-size` to **50% of total
 * RAM** (see next/dist/cli/next-dev.js). On a 16 GB machine that's an ~8 GB
 * ceiling — but if far less than that is actually free, V8 keeps growing toward
 * a limit the OS can't back with real memory, starts swapping, and collapses
 * into multi-second mark-compacts:
 *
 *   FATAL ERROR: Ineffective mark-compacts near heap limit
 *
 * Next skips that override when NODE_OPTIONS already specifies a heap size, so
 * setting a *reachable* ceiling here makes V8 collect normally instead of
 * thrashing. This app's real footprint is a few hundred MB, so 4 GB is ample.
 *
 * Override for a busier or roomier machine:  DEV_MEMORY_MB=2048 npm run dev
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import os from "node:os";

const require = createRequire(import.meta.url);

const DEFAULT_MB = 4096;
const requested = Number(process.env.DEV_MEMORY_MB);
const heapMb = Number.isFinite(requested) && requested >= 512 ? Math.floor(requested) : DEFAULT_MB;

const totalMb = Math.round(os.totalmem() / 1048576);
const freeMb = Math.round(os.freemem() / 1048576);
if (heapMb > freeMb) {
  console.warn(
    `[dev] Heap ceiling ${heapMb} MB exceeds free RAM (~${freeMb} MB). ` +
      `Close some apps or run with DEV_MEMORY_MB=${Math.max(1024, Math.floor(freeMb * 0.6))}.`,
  );
}
console.log(`[dev] Node heap ceiling: ${heapMb} MB (RAM ${totalMb} MB total, ~${freeMb} MB free)`);

const nodeOptions = [process.env.NODE_OPTIONS, `--max-old-space-size=${heapMb}`]
  .filter(Boolean)
  .join(" ");

const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
