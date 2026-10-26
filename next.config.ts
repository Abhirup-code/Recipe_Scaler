import type { NextConfig } from "next";

// Deployed as a static site (GitHub Pages). CI sets NEXT_PUBLIC_BASE_PATH to "/<repo-name>".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
