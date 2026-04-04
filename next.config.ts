import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "static.wixstatic.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "vgtgcjnrsladdharzkwn.supabase.co" },
    ],
    // COST-FIX: Cache optimized images longer
    minimumCacheTTL: 86400, // 24 hours
  },
  // COST-FIX: Aggressive caching headers for static assets
  async headers() {
    return [
      {
        source: "/api/public/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/api/public/instagram/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=21600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Static pages — tell Vercel edge to cache aggressively
        source: "/(tasarimcilar|kesfet|blog|designers|profesyoneller)(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/giris",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/kayit",
        permanent: true,
      },
      {
        source: "/designers",
        destination: "/tasarimcilar",
        permanent: true,
      },
      {
        source: "/professionals",
        destination: "/tasarimcilar",
        permanent: true,
      },
      {
        source: "/discover",
        destination: "/kesfet",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
