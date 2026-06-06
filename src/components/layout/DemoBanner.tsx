'use client';

/**
 * DemoBanner — bovenste balk die aangeeft dat demo modus actief is.
 * Bevat een knop om demo te stoppen en terug te gaan naar login.
 */

import { useRouter } from 'next/navigation';
import { useDemo }   from '@/lib/demo-context';

export default function DemoBanner() {
  const router = useRouter();
  const { stopDemo } = useDemo();

  function handleStop() {
    stopDemo();
    router.push('/login');
  }

  return (
    <div
      role="banner"
      style={{
        height: 40,
        background: 'linear-gradient(90deg, #0179FE, #4893FF)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '0 16px',
        fontSize: 13,
        fontWeight: 500,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      <span>✨ Demo modus — je bekijkt voorbeelddata, geen echte gegevens</span>
      <button
        onClick={handleStop}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 6,
          padding: '3px 10px',
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Stoppen
      </button>
    </div>
  );
}
