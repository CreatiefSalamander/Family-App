'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmt } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import type { Schuld } from '@/types';

const INIT_SCHULDEN = [
  { schuldeiser: 'Avres', type: 'Betalingsregeling', oorspronkelijk: 26200, afgelost: 0, maandtermijn: 300, status: 'Open' as const, kleur: '#EF4444' },
  { schuldeiser: 'DUO Studieschuld', type: 'Lening', oorspronkelijk: 13500, afgelost: 0, maandtermijn: 170, status: 'Actief' as const, kleur: '#F59E0B' },
  { schuldeiser: 'Advocaat kosten', type: 'Rekening', oorspronkelijk: 5758, afgelost: 0, maandtermijn: 0, status: 'Open' as const, kleur: '#EF4444' },
  { schuldeiser: 'Belastingdienst', type: 'Belastingschuld', oorspronkelijk: 4925, afgelost: 0, maandtermijn: 0, status: 'Open' as const, kleur: '#F97316' },
  { schuldeiser: 'ING Lening', type: 'Persoonlijke lening', oorspronkelijk: 3841, afgelost: 0, maandtermijn: 150, status: 'Actief' as const, kleur: '#F59E0B' },
];

export default function SchuldenPage() {
  const [schulden, setSchuld] = useState<Schuld[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ schuldeiser: '', type: '', oorspronkelijk: '', afgelost: '', maandtermijn: '', kleur: '#EF4444' });
  const sb = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data } = await sb.from('schulden').select('*').eq('user_id', user.id).order('created_at');
    setSchuld((data || []) as unknown as Schuld[]);
  }

  async function saveSchuld() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !form.schuldeiser) return;
    const s = {
      user_id: user.id,
      schuldeiser: form.schuldeiser,
      type: form.type,
      oorspronkelijk: parseFloat(form.oorspronkelijk) || 0,
      afgelost: parseFloat(form.afgelost) || 0,
      maandtermijn: parseFloat(form.maandtermijn) || 0,
      kleur: form.kleur,
      status: 'Open' as const,
    };
    const { data } = await sb.from('schulden').insert(s).select().single();
    if (data) { setSchuld(prev => [...prev, data as unknown as Schuld]); setShowAdd(false); }
  }

  const displayed = schulden.length > 0
    ? schulden
    : INIT_SCHULDEN.map((s, i) => ({ ...s, id: String(i), user_id: '', notitie: undefined, regeling: undefined, start_datum: undefined, einde_datum: undefined }));

  const totaalRestant = displayed.reduce((s, d) => s + (d.oorspronkelijk - d.afgelost), 0);
  const totaalTermijn = displayed.reduce((s, d) => s + d.maandtermijn, 0);

  const stats = [
    { label: 'Totaal restant', value: fmt(totaalRestant), color: 'text-red-500' },
    { label: 'Maandtermijn', value: fmt(totaalTermijn), color: 'text-amber-500' },
    { label: 'Actieve regelingen', value: String(displayed.filter(s => s.status === 'Actief').length), color: 'text-blue-600' },
    { label: 'Afbetaald', value: fmt(displayed.reduce((s, d) => s + d.afgelost, 0)), color: 'text-green-600' },
  ];

  return (
    <div className="px-7 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Schulden</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 gradient-blue text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          <Plus size={16} /> Toevoegen
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(k => (
          <div key={k.label} className="card p-5 border-l-4 border-l-gray-200">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`font-mono text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_80px] gap-2 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span>Schuldeiser</span>
          <span>Oorspronkelijk</span>
          <span>Restant</span>
          <span>Termijn/mnd</span>
          <span>%</span>
          <span>Status</span>
        </div>
        {displayed.map((s, i) => {
          const rest = s.oorspronkelijk - s.afgelost;
          const pct = s.oorspronkelijk > 0 ? Math.round((s.afgelost / s.oorspronkelijk) * 100) : 0;
          return (
            <div
              key={s.id || i}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_80px] gap-2 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 items-center"
            >
              <div>
                <p className="font-semibold text-sm">{s.schuldeiser}</p>
                <p className="text-xs text-gray-400">{s.type}</p>
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full w-32">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: pct + '%' }} />
                </div>
              </div>
              <p className="font-mono text-sm">{fmt(s.oorspronkelijk)}</p>
              <p className="font-mono text-sm text-red-500">-{fmt(rest)}</p>
              <p className="font-mono text-sm">{s.maandtermijn > 0 ? fmt(s.maandtermijn) : '—'}</p>
              <p className="text-sm font-semibold text-green-600">{pct}%</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                s.status === 'Actief' ? 'bg-blue-50 text-blue-600' :
                s.status === 'Afbetaald' ? 'bg-green-50 text-green-600' :
                'bg-red-50 text-red-600'
              }`}>
                {s.status}
              </span>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Schuld toevoegen</h2>
              <button onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {([
                ['schuldeiser', 'Schuldeiser', 'Bijv. DUO, Belastingdienst'],
                ['type', 'Type', 'Lening, Betalingsregeling...'],
                ['oorspronkelijk', 'Oorspronkelijk bedrag (€)', '26200'],
                ['afgelost', 'Afgelost (€)', '0'],
                ['maandtermijn', 'Maandtermijn (€)', '300'],
              ] as [string, string, string][]).map(([k, l, p]) => (
                <div key={k}>
                  <label className="text-sm font-medium block mb-1">{l}</label>
                  <input
                    type={['oorspronkelijk', 'afgelost', 'maandtermijn'].includes(k) ? 'number' : 'text'}
                    placeholder={p}
                    value={(form as Record<string, string>)[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold">
                Annuleren
              </button>
              <button onClick={saveSchuld} className="flex-1 gradient-blue text-white rounded-lg py-2.5 text-sm font-semibold">
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
