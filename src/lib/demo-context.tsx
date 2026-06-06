'use client';

/**
 * Demo modus context — beheert de demo-staat voor de hele app.
 * Sla 'demo' op in sessionStorage zodat het verdwijnt als de tab sluit.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  activeerDemo: () => void;
  stopDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  activeerDemo: () => {},
  stopDemo: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Lees demo-staat uit sessionStorage bij eerste render
  useEffect(() => {
    const opgeslagen = sessionStorage.getItem('demo_mode');
    if (opgeslagen === 'true') setIsDemoMode(true);
  }, []);

  const activeerDemo = () => {
    sessionStorage.setItem('demo_mode', 'true');
    // Cookie voor server components (dashboard layout bypass)
    document.cookie = 'demo_mode=1; path=/; max-age=3600; SameSite=Lax';
    setIsDemoMode(true);
  };

  const stopDemo = () => {
    sessionStorage.removeItem('demo_mode');
    // Verwijder demo cookie
    document.cookie = 'demo_mode=; path=/; max-age=0';
    setIsDemoMode(false);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, activeerDemo, stopDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export const useDemo = () => useContext(DemoContext);
