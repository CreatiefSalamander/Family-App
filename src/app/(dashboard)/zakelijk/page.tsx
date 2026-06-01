'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmt } from '@/lib/utils';
import { Briefcase } from 'lucide-react';
import type { Transactie } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ZakelijkPage() {
  const [transacties, setTransacties] = useState<Transactie[]>([]);
  const sb = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('transactions').select('*').eq('user_id', user.id).eq('is_zakelijk', true).order('date',{ascending:false});
      setTransacties((data||[]) as unknown as Transactie[]);
    }
    load();
  }, []);

  const omzet = transacties.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const kosten = transacties.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const btw = omzet * 0.21;
  const winst = omzet - kosten;

  return (
    <div className="px-7 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center"><Briefcase size={20} className="text-white" /></div>
        <div><h1 className="font-display text-2xl font-bold">Aziz Holding BV</h1><p className="text-sm text-gray-400">Zakelijk overzicht</p></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Omzet ex BTW', value:fmt(omzet), color:'text-green-600' },
          { label:'BTW 21%', value:fmt(btw), color:'text-amber-500' },
          { label:'Netto winst', value:fmt(winst), color:'text-blue-600' },
          { label:'Vaste kosten', value:fmt(kosten), color:'text-red-500' },
        ].map(k => (
          <div key={k.label} className="card p-5">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={\`font-mono text-xl font-bold \${k.color}\`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-base mb-4">Zakelijke transacties</h2>
        {transacties.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Markeer transacties als zakelijk in het transactieoverzicht</p>
        ) : transacties.slice(0,20).map(t => (
          <div key={t.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
            <div className="w-9 h-9 gradient-blue rounded-xl flex items-center justify-center"><Briefcase size={16} className="text-white"/></div>
            <div className="flex-1"><p className="text-sm font-semibold">{t.description}</p><p className="text-xs text-gray-400">{t.date}</p></div>
            <p className={\`font-mono text-sm font-bold \${t.type==='income'?'text-green-600':'text-red-500'}\`}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
