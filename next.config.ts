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

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Explicitly transpile ESM-only packages so webpack outputs valid CJS bundles
  transpilePackages: ["framer-motion", "recharts"],

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any, { dev }: { dev: boolean }) {
    if (dev) {
      // Replace eval-based source maps with inline source maps.
      // Electron's renderer can reject eval() wrapped modules causing SyntaxErrors.
      config.devtool = "inline-cheap-source-map";
    }
    return config;
  },
};

export default nextConfig;
