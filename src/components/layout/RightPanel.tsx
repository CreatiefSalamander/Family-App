'use client';
import type { Rekening, Budget, Schuld, Doel, Transactie } from '@/types';
import { fmt } from '@/lib/utils';
import { PlusCircle } from 'lucide-react';

interface Props {
  rekeningen: Rekening[];
  budgetten: Budget[];
  schulden: Schuld[];
  doelen: Doel[];
  transacties: Transactie[];
}

const BAR_COLORS: Record<string,string> = { blue:'#0179FE', teal:'#01797A', purple:'#6172F3', green:'#059669' };

export default function RightPanel({ rekeningen, budgetten, schulden, doelen, transacties }: Props) {
  const now = new Date();
  const mTx = transacties.filter(t => { const d=new Date(t.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&t.type==='expense'; });

  return (
    <aside className="w-[355px] flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto p-5">
      {/* Rekeningen */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Mijn rekeningen</h3>
          <a href="/rekeningen" className="text-xs text-[#0179FE] font-medium hover:underline flex items-center gap-1"><PlusCircle size={12} />Toevoegen</a>
        </div>
        <div className="space-y-2">
          {rekeningen.slice(0,3).map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
              <div className="w-1 h-9 rounded-full flex-shrink-0" style={{ background: BAR_COLORS[r.color_gradient] || BAR_COLORS.blue }} />
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{r.name}</div><div className="text-xs text-gray-400">{r.account_number_masked}</div></div>
              <div className="font-mono text-sm font-semibold">{fmt(r.balance)}</div>
            </div>
          ))}
          {!rekeningen.length && <p className="text-xs text-gray-400 py-2">Geen rekeningen</p>}
        </div>
        <a href="/rekeningen" className="text-xs text-[#0179FE] font-medium hover:underline block mt-2">Alle rekeningen →</a>
      </div>

      {/* Budgetten */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Budgetten</h3>
          <a href="/begroting" className="text-xs text-[#0179FE] font-medium hover:underline">Beheren →</a>
        </div>
        <div className="space-y-3">
          {budgetten.slice(0,4).map(b => {
            const sp = mTx.filter(t=>t.category===b.category).reduce((s,t)=>s+t.amount,0);
            const pct = b.monthly_limit > 0 ? Math.min(100,(sp/b.monthly_limit)*100) : 0;
            const color = pct < 70 ? '#22C55E' : pct < 90 ? '#F59E0B' : '#EF4444';
            return (
              <div key={b.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{b.category}</span>
                  <span className="text-gray-400">{fmt(sp)} / {fmt(b.monthly_limit)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: pct+'%', background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schulden */}
      {schulden.length > 0 && (
        <div className="mb-7">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Schulden</h3>
          <div className="text-xl font-mono font-bold text-red-500 mb-2">
            -{fmt(schulden.reduce((s,d) => s+(d.oorspronkelijk-d.afgelost), 0))}
          </div>
          {schulden.slice(0,3).map(s => {
            const rest = s.oorspronkelijk - s.afgelost;
            const pct = (s.afgelost/s.oorspronkelijk)*100;
            return (
              <div key={s.id} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{s.schuldeiser}</span>
                  <span className="text-red-500">-{fmt(rest)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-red-400 rounded-full" style={{width:pct+'%'}} /></div>
              </div>
            );
          })}
        </div>
      )}

      {/* Doelen */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Doelen</h3>
          <a href="/doelen" className="text-xs text-[#0179FE] font-medium hover:underline">Alle doelen →</a>
        </div>
        {doelen.slice(0,2).map(g => {
          const pct = g.target_amount > 0 ? Math.min(100,(g.current_amount/g.target_amount)*100) : 0;
          return (
            <div key={g.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl mb-2">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-xl flex-shrink-0">{g.emoji || '🎯'}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{g.name}</div>
                <div className="text-xs text-gray-400">{Math.round(pct)}% — {fmt(g.current_amount)} / {fmt(g.target_amount)}</div>
              </div>
            </div>
          );
        })}
        {!doelen.length && <p className="text-xs text-gray-400">Geen doelen</p>}
      </div>
    </aside>
  );
}
