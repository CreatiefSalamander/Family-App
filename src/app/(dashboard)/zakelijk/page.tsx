'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmt, fmtDate } from '@/lib/utils';
import { Briefcase, Building2 } from 'lucide-react';
import type { Transactie } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const OPDRACHTGEVERS = [
  { naam: 'Leaflink', ex_btw: 2500, omschrijving: 'Softwareontwikkeling' },
  { naam: 'Netvice', ex_btw: 2000, omschrijving: 'IT-consultancy' },
  { naam: 'Dakprofijt', ex_btw: 1500, omschrijving: 'Webontwikkeling' },
];

const VASTE_KOSTEN = [
  { omschrijving: 'Autolease', bedrag: 850 },
  { omschrijving: 'Boekhouder', bedrag: 150 },
  { omschrijving: 'Verzekeringen', bedrag: 100 },
  { omschrijving: 'Telefoon zakelijk', bedrag: 50 },
];

const MAANDEN = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

export default function ZakelijkPage() {
  const [transacties, setTransacties] = useState<Transactie[]>([]);
  const sb = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('transactions').select('*').eq('user_id', user.id).eq('is_zakelijk', true).order('date', { ascending: false });
      setTransacties((data || []) as unknown as Transactie[]);
    }
    load();
  }, []);

  const totaalOmzet = OPDRACHTGEVERS.reduce((s, o) => s + o.ex_btw, 0);
  const totaalBtw = totaalOmzet * 0.21;
  const totaalVaste = VASTE_KOSTEN.reduce((s, k) => s + k.bedrag, 0);
  const nettoWinst = totaalOmzet - totaalVaste;
  const txOmzet = transacties.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const txKosten = transacties.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const now = new Date();
  const chartData = MAANDEN.map((naam, i) => {
    const mTx = transacties.filter(t => { const d = new Date(t.date); return d.getMonth() === i && d.getFullYear() === now.getFullYear(); });
    return {
      naam,
      Omzet: mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) || (i <= now.getMonth() ? totaalOmzet : 0),
      Kosten: mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) || (i <= now.getMonth() ? totaalVaste : 0),
    };
  });

  return (
    <div className="px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center shadow-md">
          <Building2 size={22} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">Aziz Holding BV</h1>
            <span className="px-2.5 py-0.5 bg-blue-50 text-[#0179FE] text-xs font-semibold rounded-full border border-blue-100">KVK geregistreerd</span>
          </div>
          <p className="text-sm text-gray-400">Zakelijk overzicht — {now.getFullYear()}</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Omzet ex BTW', value: fmt(totaalOmzet), color: 'text-green-600', border: 'border-l-green-500', sub: '/mnd voorgevuld' },
          { label: 'BTW 21%', value: fmt(totaalBtw), color: 'text-amber-500', border: 'border-l-amber-400', sub: 'Af te dragen' },
          { label: 'Netto winst', value: fmt(nettoWinst), color: 'text-[#0179FE]', border: 'border-l-[#0179FE]', sub: 'Na vaste kosten' },
          { label: 'Vaste kosten', value: fmt(totaalVaste), color: 'text-red-500', border: 'border-l-red-400', sub: '/mnd' },
        ].map(k => (
          <div key={k.label} className={`card p-5 border-l-4 ${k.border}`}>
            <p className="text-xs text-gray-400 mb-2 font-medium">{k.label}</p>
            <p className={`font-mono text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Opdrachtgevers */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-4 flex items-center gap-2"><Briefcase size={16} className="text-[#0179FE]" />Opdrachtgevers</h2>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span>Naam</span><span>Ex BTW</span><span>BTW 21%</span><span>Incl BTW</span>
            </div>
            {OPDRACHTGEVERS.map(o => (
              <div key={o.naam} className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-3 border-t border-gray-50 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-semibold text-sm">{o.naam}</p>
                  <p className="text-xs text-gray-400">{o.omschrijving}</p>
                </div>
                <p className="font-mono text-sm font-semibold">{fmt(o.ex_btw)}</p>
                <p className="font-mono text-sm text-amber-500">{fmt(o.ex_btw * 0.21)}</p>
                <p className="font-mono text-sm font-bold text-green-600">{fmt(o.ex_btw * 1.21)}</p>
              </div>
            ))}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-3 border-t border-gray-200 bg-gray-50 font-bold">
              <span className="text-sm">Totaal</span>
              <span className="font-mono text-sm">{fmt(totaalOmzet)}</span>
              <span className="font-mono text-sm text-amber-500">{fmt(totaalBtw)}</span>
              <span className="font-mono text-sm text-green-600">{fmt(totaalOmzet * 1.21)}</span>
            </div>
          </div>
        </div>

        {/* BTW berekening */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-4">BTW Berekening</h2>
          <div className="space-y-3">
            <div className="flex justify-between p-3.5 bg-green-50 rounded-xl">
              <span className="text-sm font-medium text-green-700">Te ontvangen BTW</span>
              <span className="font-mono text-sm font-bold text-green-700">+{fmt(totaalBtw)}</span>
            </div>
            <div className="flex justify-between p-3.5 bg-red-50 rounded-xl">
              <span className="text-sm font-medium text-red-600">BTW op inkoopkosten</span>
              <span className="font-mono text-sm font-bold text-red-600">-{fmt(totaalVaste * 0.21)}</span>
            </div>
            <div className="flex justify-between p-4 gradient-blue rounded-xl">
              <span className="text-sm font-bold text-white">Af te dragen BTW</span>
              <span className="font-mono text-base font-bold text-white">{fmt(totaalBtw - totaalVaste * 0.21)}</span>
            </div>
          </div>

          <h3 className="font-semibold text-sm mt-5 mb-3">Vaste Kosten</h3>
          <div className="space-y-2">
            {VASTE_KOSTEN.map(k => (
              <div key={k.omschrijving} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">{k.omschrijving}</span>
                <span className="font-mono font-semibold text-red-500">{fmt(k.bedrag)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm py-2 font-bold">
              <span>Totaal</span>
              <span className="font-mono text-red-500">{fmt(totaalVaste)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-base mb-4">Winst & Verlies — {now.getFullYear()}</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barSize={10}>
            <XAxis dataKey="naam" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '€' + (v / 1000) + 'k'} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Bar dataKey="Omzet" fill="#22C55E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Kosten" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Zakelijke transacties */}
      {transacties.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-4">Geboekte zakelijke transacties</h2>
          {transacties.slice(0, 15).map(t => (
            <div key={t.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center flex-shrink-0"><Briefcase size={15} className="text-white" /></div>
              <div className="flex-1"><p className="text-sm font-semibold">{t.description}</p><p className="text-xs text-gray-400">{fmtDate(t.date)}</p></div>
              <p className={`font-mono text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
