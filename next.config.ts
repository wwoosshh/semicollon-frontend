import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project to avoid Next.js inferring a parent
  // directory when multiple lockfiles are present on the machine.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
