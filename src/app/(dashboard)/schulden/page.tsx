'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmt } from '@/lib/utils';
import { Plus, X, TrendingDown } from 'lucide-react';
import type { Schuld } from '@/types';

const INIT_SCHULDEN = [
  { schuldeiser: 'Avres', type: 'Betalingsregeling', oorspronkelijk: 26200, afgelost: 0, maandtermijn: 200, status: 'Open' as const, kleur: '#EF4444' },
  { schuldeiser: 'DUO Hoofdsom', type: 'Studieschuld', oorspronkelijk: 13500, afgelost: 0, maandtermijn: 150, status: 'Actief' as const, kleur: '#F59E0B' },
  { schuldeiser: 'Advocaat schuld', type: 'Rekening', oorspronkelijk: 5758, afgelost: 0, maandtermijn: 100, status: 'Open' as const, kleur: '#EF4444' },
  { schuldeiser: 'Belastingdienst', type: 'Belastingschuld', oorspronkelijk: 4925, afgelost: 0, maandtermijn: 91, status: 'Open' as const, kleur: '#F97316' },
  { schuldeiser: 'ING Lening', type: 'Persoonlijke lening', oorspronkelijk: 3841, afgelost: 0, maandtermijn: 150, status: 'Actief' as const, kleur: '#F59E0B' },
];

export default function SchuldenPage() {
  const [schulden, setSchuld] = useState<Schuld[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ schuldeiser: '', type: '', oorspronkelijk: '', afgelost: '0', maandtermijn: '', kleur: '#EF4444' });
  const sb = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data } = await sb.from('schulden').select('*').eq('user_id', user.id).order('oorspronkelijk', { ascending: false });
    if (data && data.length === 0) {
      // Eerste gebruik: voorvullen
      const inserts = INIT_SCHULDEN.map(s => ({ ...s, user_id: user.id }));
      const { data: inserted } = await sb.from('schulden').insert(inserts).select();
      setSchuld((inserted || []) as unknown as Schuld[]);
    } else {
      setSchuld((data || []) as unknown as Schuld[]);
    }
    setLoaded(true);
  }

  async function saveSchuld() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !form.schuldeiser) return;
    const s = { user_id: user.id, schuldeiser: form.schuldeiser, type: form.type, oorspronkelijk: parseFloat(form.oorspronkelijk) || 0, afgelost: parseFloat(form.afgelost) || 0, maandtermijn: parseFloat(form.maandtermijn) || 0, kleur: form.kleur, status: 'Open' as const };
    const { data } = await sb.from('schulden').insert(s).select().single();
    if (data) { setSchuld(prev => [...prev, data as unknown as Schuld]); setShowAdd(false); setForm({ schuldeiser: '', type: '', oorspronkelijk: '', afgelost: '0', maandtermijn: '', kleur: '#EF4444' }); }
  }

  const totaalRestant = schulden.reduce((s, d) => s + (d.oorspronkelijk - d.afgelost), 0);
  const totaalTermijn = schulden.reduce((s, d) => s + (d.maandtermijn || 0), 0);
  const totaalAfgelost = schulden.reduce((s, d) => s + (d.afgelost || 0), 0);
  const actief = schulden.filter(s => s.status === 'Actief').length;

  return (
    <div className="px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><TrendingDown size={20} className="text-red-500" /></div>
          <div><h1 className="font-display text-2xl font-bold">Schulden</h1><p className="text-sm text-gray-400">Overzicht en aflossingsplanning</p></div>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"><Plus size={15} />Toevoegen</button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Totaal restant', value: fmt(totaalRestant), color: 'text-red-500', border: 'border-l-red-400' },
          { label: 'Maandtermijn', value: fmt(totaalTermijn), color: 'text-amber-500', border: 'border-l-amber-400' },
          { label: 'Actieve regelingen', value: String(actief), color: 'text-[#0179FE]', border: 'border-l-[#0179FE]' },
          { label: 'Totaal afgelost', value: fmt(totaalAfgelost), color: 'text-green-600', border: 'border-l-green-500' },
        ].map(k => (
          <div key={k.label} className={`card p-5 border-l-4 ${k.border}`}>
            <p className="text-xs text-gray-400 mb-2 font-medium">{k.label}</p>
            <p className={`font-mono text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Schulden table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-base">Schuldenlijst</h2>
        </div>
        {!loaded ? (
          <div className="space-y-3 p-6">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : (
          schulden.map((s) => {
            const rest = s.oorspronkelijk - (s.afgelost || 0);
            const pct = s.oorspronkelijk > 0 ? Math.round(((s.afgelost || 0) / s.oorspronkelijk) * 100) : 0;
            const mndOver = s.maandtermijn > 0 ? Math.ceil(rest / s.maandtermijn) : null;
            return (
              <div key={s.id} className="px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: s.kleur || '#EF4444' }} />
                    <div>
                      <p className="font-semibold text-sm">{s.schuldeiser}</p>
                      <p className="text-xs text-gray-400">{s.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs text-gray-400">Oorspronkelijk</p>
                      <p className="font-mono text-sm font-semibold">{fmt(s.oorspronkelijk)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Restant</p>
                      <p className="font-mono text-sm font-bold text-red-500">-{fmt(rest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Termijn/mnd</p>
                      <p className="font-mono text-sm font-semibold">{s.maandtermijn > 0 ? fmt(s.maandtermijn) : '—'}</p>
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.status === 'Actief' ? 'bg-blue-50 text-blue-600' : s.status === 'Afbetaald' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-6">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{pct}% afgelost</span>
                    {mndOver && <span>~{mndOver} maanden resterend</span>}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: pct + '%' }} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h2 className="font-display font-bold text-lg">Schuld toevoegen</h2><button onClick={() => setShowAdd(false)}><X size={20} /></button></div>
            <div className="space-y-4">
              {[['schuldeiser', 'Schuldeiser', 'Bijv. DUO, Belastingdienst'], ['type', 'Type', 'Lening, Betalingsregeling...']].map(([k, l, p]) => (
                <div key={k}><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{l}</label>
                  <input type="text" placeholder={p} value={(form as Record<string, string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="input-field" /></div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[['oorspronkelijk', 'Bedrag (€)'], ['afgelost', 'Afgelost (€)'], ['maandtermijn', 'Termijn/mnd (€)']].map(([k, l]) => (
                  <div key={k}><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{l}</label>
                    <input type="number" value={(form as Record<string, string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="input-field" /></div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50">Annuleren</button>
              <button onClick={saveSchuld} className="flex-1 btn-primary rounded-xl py-2.5">Opslaan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
