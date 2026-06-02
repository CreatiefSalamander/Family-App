'use client';

import { useState, useEffect } from 'react';

interface Props {
  naam: string;
  size?: number;
}

const KLEUREN = [
  '#0179FE','#22C55E','#F59E0B','#EF4444','#8B5CF6',
  '#06B6D4','#EC4899','#10B981','#F97316','#6366F1',
];

function kleurVoorNaam(naam: string): string {
  let hash = 0;
  for (let i = 0; i < naam.length; i++) hash = naam.charCodeAt(i) + ((hash << 5) - hash);
  return KLEUREN[Math.abs(hash) % KLEUREN.length];
}

/* Eenvoudige in-memory cache */
const logoCache: Record<string, string | null> = {};

export default function MerchantLogo({ naam, size = 36 }: Props) {
  const [logoUrl, setLogoUrl]   = useState<string | null>(null);
  const [imgFail, setImgFail]   = useState(false);
  const cacheKey = naam.toLowerCase().trim();

  useEffect(() => {
    if (!naam) return;

    /* Cache hit */
    if (cacheKey in logoCache) {
      setLogoUrl(logoCache[cacheKey]);
      return;
    }

    /* Haal logo op via server route */
    fetch('/api/merchant-logo', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ naam }),
    })
      .then(r => r.json())
      .then(d => {
        const url = d.logoUrl ?? null;
        logoCache[cacheKey] = url;
        setLogoUrl(url);
      })
      .catch(() => {
        logoCache[cacheKey] = null;
        setLogoUrl(null);
      });
  }, [naam]);

  const kleur = kleurVoorNaam(naam);
  const letter = naam.trim()[0]?.toUpperCase() ?? '?';

  /* Fallback cirkel als geen logo */
  const Fallback = () => (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: kleur, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.4,
      fontWeight: 700, fontFamily: "'Inter',sans-serif",
      flexShrink: 0,
    }}>
      {letter}
    </div>
  );

  if (!logoUrl || imgFail) return <Fallback />;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F3F4F6',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={naam}
        width={size}
        height={size}
        style={{ objectFit: 'contain', width: size, height: size }}
        onError={() => setImgFail(true)}
      />
    </div>
  );
}
