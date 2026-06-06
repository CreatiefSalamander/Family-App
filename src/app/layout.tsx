import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DemoProvider } from '@/lib/demo-context';

export const metadata: Metadata = {
  title: 'Household',
  description: 'Persoonlijk financieel dashboard — beheer je geld, schulden en doelen.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable:         true,
    statusBarStyle:  'black-translucent',
    title:           'Household',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor:        '#0179FE',
  width:             'device-width',
  initialScale:      1,
  maximumScale:      1,
  userScalable:      false,
  viewportFit:       'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Preconnect voor Google Fonts — voorkomt render-blocking font load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch voor Supabase en externe API's */}
        <link rel="dns-prefetch" href="https://lttxjfrtfrjnlazmbcyq.supabase.co" />
      </head>
      <body>
        {/* DemoProvider wraps alles zodat elke pagina demo-modus kan detecteren */}
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
