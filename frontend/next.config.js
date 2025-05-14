/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["i.ytimg.com", "img.youtube.com", "yt3.ggpht.com"],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api",
    EXTERNAL_API_URL:
      process.env.EXTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8001/api",
  },
  async rewrites() {
    // Use INTERNAL_API_URL for server-side communication (within Docker network)
    // Fall back to NEXT_PUBLIC_API_URL for local development
    const apiUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8001/api";

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
      // Specific rules for endpoints to ensure they work correctly
      {
        source: "/api/youtube/feed",
        destination: `${apiUrl}/youtube/feed`,
      },
      {
        source: "/api/summary/:id",
        destination: `${apiUrl}/summary/:id`,
      },
    ];
  },
};

module.exports = nextConfig;
