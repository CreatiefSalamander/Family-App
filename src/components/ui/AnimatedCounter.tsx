'use client';
import { useEffect, useRef, useState } from 'react';

// Telt van vorige naar nieuwe waarde op met easeOut animatie
const fmtEuro = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

interface Props {
  amount: number;
  duration?: number; // ms
}

export default function AnimatedCounter({ amount, duration = 900 }: Props) {
  const [displayed, setDisplayed] = useState(amount);
  const prevAmount = useRef(amount);
  const frameRef   = useRef<number | null>(null);
  const startRef   = useRef<number | null>(null);

  useEffect(() => {
    const from = prevAmount.current;
    const to   = amount;
    prevAmount.current = amount;

    // Geen animatie als verschil nihil is
    if (Math.abs(to - from) < 0.01) {
      setDisplayed(to);
      return;
    }

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed  = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOut cubic — snel starten, geleidelijk stoppen
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayed(from + (to - from) * ease);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [amount, duration]);

  return <span>{fmtEuro(displayed)}</span>;
}
