import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable server features not available in static export
  experimental: {
    // No server-side features needed; all DB ops go through Electron IPC
  },
};

export default nextConfig;
