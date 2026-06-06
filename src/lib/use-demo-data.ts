'use client';

/**
 * useDemoData — geeft demo data terug als demo modus actief is.
 * Gebruik in client components die normaal Supabase data ophalen.
 */

import { useDemo } from './demo-context';
import {
  DEMO_USER,
  DEMO_REKENINGEN,
  DEMO_TRANSACTIES,
  DEMO_BUDGETS,
  DEMO_SCHULDEN,
  DEMO_DOELEN,
} from './demo-data';

export function useDemoData() {
  const { isDemoMode } = useDemo();

  return {
    isDemoMode,
    user:        isDemoMode ? DEMO_USER       : null,
    rekeningen:  isDemoMode ? DEMO_REKENINGEN : null,
    transacties: isDemoMode ? DEMO_TRANSACTIES : null,
    budgets:     isDemoMode ? DEMO_BUDGETS    : null,
    schulden:    isDemoMode ? DEMO_SCHULDEN   : null,
    doelen:      isDemoMode ? DEMO_DOELEN     : null,
  };
}
