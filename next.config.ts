import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — all DB operations go through Electron IPC, no server needed
  output: "export",
  distDir: "out",

  // Required for Electron file:// protocol (absolute paths in HTML)
  trailingSlash: true,

  // Disable Next.js image optimization (not available in static export)
  images: {
    unoptimized: true,
  },

  // Exclude server-only APIs that don't work in static export
  typescript: {
    // Type errors are caught by our explicit tsc --noEmit step
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ensure consistent asset paths when loaded via file://
  assetPrefix: undefined,
};

export default nextConfig;
