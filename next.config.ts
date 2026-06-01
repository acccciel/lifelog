import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "docs",
  basePath: "/lifelog",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
