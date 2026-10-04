import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ NO "standalone" — Vercel handles deployment automatically
  serverExternalPackages: ["@react-pdf/renderer", "pdfkit"],
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-c7d9c09254244c299593b48214463b97.r2.dev",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;

