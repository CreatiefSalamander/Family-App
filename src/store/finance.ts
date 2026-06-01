import { create } from 'zustand';
import type { Transactie, Rekening, Budget, Schuld, Doel, Profiel } from '@/types';

interface FinanceStore {
  transacties: Transactie[];
  rekeningen: Rekening[];
  budgetten: Budget[];
  schulden: Schuld[];
  doelen: Doel[];
  profiel: Profiel | null;
  loading: boolean;
  setTransacties: (t: Transactie[]) => void;
  setRekeningen: (r: Rekening[]) => void;
  setBudgetten: (b: Budget[]) => void;
  setSchuld: (s: Schuld[]) => void;
  setDoelen: (d: Doel[]) => void;
  setProfiel: (p: Profiel) => void;
  setLoading: (l: boolean) => void;
  addTransactie: (t: Transactie) => void;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  transacties: [], rekeningen: [], budgetten: [], schulden: [], doelen: [], profiel: null, loading: false,
  setTransacties: (t) => set({ transacties: t }),
  setRekeningen: (r) => set({ rekeningen: r }),
  setBudgetten: (b) => set({ budgetten: b }),
  setSchuld: (s) => set({ schulden: s }),
  setDoelen: (d) => set({ doelen: d }),
  setProfiel: (p) => set({ profiel: p }),
  setLoading: (l) => set({ loading: l }),
  addTransactie: (t) => set((s) => ({ transacties: [t, ...s.transacties] })),
}));
