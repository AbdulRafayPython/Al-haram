import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The server preloads every route's modules at startup (38 routes here,
    // incl. the whole /api surface), trading memory for first-hit latency.
    // Disabling it keeps the dev/server baseline smaller; routes load on demand.
    preloadEntriesOnStart: false,
  },
  async redirects() {
    return [
      {
        source: "/umrah-packages",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
