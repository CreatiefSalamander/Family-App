'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmt } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Transactie } from '@/types';

const MAANDEN = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

export default function JaaroverzichtPage() {
  const [transacties, setTransacties] = useState<Transactie[]>([]);
  const [jaar, setJaar] = useState(new Date().getFullYear());
  const sb = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('transactions').select('*').eq('user_id', user.id);
      setTransacties((data||[]) as unknown as Transactie[]);
    }
    load();
  }, []);

  const chartData = MAANDEN.map((naam, i) => {
    const mTx = transacties.filter(t => { const d=new Date(t.date); return d.getMonth()===i&&d.getFullYear()===jaar; });
    const inc = mTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp = mTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    return { naam, Inkomsten:Math.round(inc), Uitgaven:Math.round(exp), Netto:Math.round(inc-exp) };
  });

  return (
    <div className="px-7 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Jaaroverzicht {jaar}</h1>
        <div className="flex gap-2">
          <button onClick={()=>setJaar(j=>j-1)} className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 text-sm">←</button>
          <button onClick={()=>setJaar(j=>j+1)} className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 text-sm">→</button>
        </div>
      </div>
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-base mb-4">Inkomsten vs Uitgaven</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="naam" tick={{fontSize:12}} />
            <YAxis tick={{fontSize:12}} tickFormatter={v=>'€'+v} />
            <Tooltip formatter={(v:number) => fmt(v)} />
            <Legend />
            <Bar dataKey="Inkomsten" fill="#22C55E" radius={[4,4,0,0]} />
            <Bar dataKey="Uitgaven" fill="#EF4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span>Maand</span><span>Inkomsten</span><span>Uitgaven</span><span>Aflossingen</span><span>Netto</span>
        </div>
        {chartData.map(row => (
          <div key={row.naam} className="grid grid-cols-[120px_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <span className="text-sm font-medium">{row.naam}</span>
            <span className="font-mono text-sm text-green-600">+{fmt(row.Inkomsten)}</span>
            <span className="font-mono text-sm text-red-500">-{fmt(row.Uitgaven)}</span>
            <span className="font-mono text-sm text-gray-400">—</span>
            <span className={\`font-mono text-sm font-bold \${row.Netto>=0?'text-green-600':'text-red-500'}\`}>{fmt(row.Netto)}</span>
          </div>
        ))}
        <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 bg-gray-50 font-bold">
          <span className="text-sm">Totaal</span>
          <span className="font-mono text-sm text-green-600">{fmt(chartData.reduce((s,r)=>s+r.Inkomsten,0))}</span>
          <span className="font-mono text-sm text-red-500">{fmt(chartData.reduce((s,r)=>s+r.Uitgaven,0))}</span>
          <span className="font-mono text-sm">—</span>
          <span className={\`font-mono text-sm \${chartData.reduce((s,r)=>s+r.Netto,0)>=0?'text-green-600':'text-red-500'}\`}>{fmt(chartData.reduce((s,r)=>s+r.Netto,0))}</span>
        </div>
      </div>
    </div>
  );
}
