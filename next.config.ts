import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        /* Network-first voor Supabase — nooit financiële data cachen */
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler:    'NetworkFirst',
        options: {
          cacheName:             'supabase-cache',
          networkTimeoutSeconds: 10,
        },
      },
      {
        /* Cache-first voor statische assets */
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|woff2|woff|ttf)$/i,
        handler:    'CacheFirst',
        options: {
          cacheName:  'static-assets',
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        /* Stale-while-revalidate voor Next.js chunks */
        urlPattern: /^\/_next\//i,
        handler:    'StaleWhileRevalidate',
        options: { cacheName: 'next-chunks' },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.brandfetch.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'encrypted-tbn3.gstatic.com' },
      { protocol: 'https', hostname: 'serpapi.com' },
      { protocol: 'https', hostname: 'openweathermap.org' },
    ],
  },

  /* Sluit zware server-only pakketten uit van de Edge runtime */
  serverExternalPackages: [
    '@anthropic-ai/sdk',
    '@opentelemetry/api',
    'mammoth',
    'xlsx',
    'web-push',
  ],
};

export default withPWA(nextConfig);
