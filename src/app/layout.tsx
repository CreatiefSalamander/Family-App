import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Family-App',
  description: 'Persoonlijke finance manager voor Abdul & gezin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
