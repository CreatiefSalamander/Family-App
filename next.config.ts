import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.brandfetch.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'encrypted-tbn3.gstatic.com' },
      { protocol: 'https', hostname: 'serpapi.com' },
    ],
  },

  /* Sluit zware server-only pakketten uit van de Edge runtime.
     @anthropic-ai/sdk heeft @opentelemetry/api nodig — die hoort
     NIET in de middleware/edge bundle thuis. */
  serverExternalPackages: [
    '@anthropic-ai/sdk',
    '@opentelemetry/api',
    'mammoth',
    'xlsx',
  ],
};

export default nextConfig;
