'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RightPanel from '@/components/layout/RightPanel';
import { fmt, fmtDate } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { Transactie, Rekening, Budget, Schuld, Doel } from '@/types';

const CATS: Record<string, { bg: string; color: string; icon: string }> = {
  Boodschappen: { bg:'#EEF2FF', color:'#6366F1', icon:'🛒' },
  Eten: { bg:'#FFFBEB', color:'#F59E0B', icon:'🍔' },
  Transport: { bg:'#EFF6FF', color:'#3B82F6', icon:'🚗' },
  Wonen: { bg:'#F0FDF4', color:'#22C55E', icon:'🏠' },
  Inkomen: { bg:'#F0FDF4', color:'#059669', icon:'💼' },
  Salaris: { bg:'#F0FDF4', color:'#059669', icon:'💼' },
  default: { bg:'#F9FAFB', color:'#6B7280', icon:'📄' },
};

export default function DashboardPage() {
  const [transacties, setTransacties] = useState<Transactie[]>([]);
  const [rekeningen, setRekeningen] = useState<Rekening[]>([]);
  const [budgetten, setBudgetten] = useState<Budget[]>([]);
  const [schulden, setSchuld] = useState<Schuld[]>([]);
  const [doelen, setDoelen] = useState<Doel[]>([]);
  const [loading, setLoading] = useState(true);
  const sb = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const [{ data: tx }, { data: rek }, { data: bud }, { data: sch }, { data: doel }] = await Promise.all([
        sb.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        sb.from('accounts').select('*').eq('user_id', user.id),
        sb.from('budgets').select('*').eq('user_id', user.id),
        sb.from('schulden').select('*').eq('user_id', user.id),
        sb.from('goals').select('*').eq('user_id', user.id),
      ]);
      setTransacties((tx || []) as unknown as Transactie[]);
      setRekeningen((rek || []) as unknown as Rekening[]);
      setBudgetten((bud || []) as unknown as Budget[]);
      setSchuld((sch || []) as unknown as Schuld[]);
      setDoelen((doel || []) as unknown as Doel[]);
      setLoading(false);
    }
    load();
  }, []);

  const now = new Date();
  const mTx = transacties.filter(t => { const d=new Date(t.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); });
  const inc = mTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const exp = mTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const net = inc - exp;
  const bal = transacties.reduce((s,t)=>s+(t.type==='income'?1:-1)*t.amount,0);

  const KPIS = [
    { label:'Totaal saldo', value:bal, icon:Wallet, color:'text-[#0179FE]', border:'border-l-[#0179FE]' },
    { label:'Inkomsten (maand)', value:inc, icon:TrendingUp, color:'text-green-600', border:'border-l-green-500' },
    { label:'Uitgaven (maand)', value:exp, icon:TrendingDown, color:'text-red-500', border:'border-l-red-500' },
    { label:'Netto (maand)', value:net, icon:Activity, color:net>=0?'text-green-600':'text-red-500', border:net>=0?'border-l-green-500':'border-l-red-500' },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {KPIS.map(({ label, value, icon: Icon, color, border }) => (
            <div key={label} className={\`card p-5 border-l-4 \${border} hover:-translate-y-0.5 transition-transform\`}>
              <div className={\`flex items-center gap-2 text-xs text-gray-500 mb-2\`}><Icon size={14} className={color} />{label}</div>
              <div className={\`font-mono text-xl font-bold \${color}\`}>{fmt(value)}</div>
            </div>
          ))}
        </div>
        {/* Recent Transactions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Recente transacties</h2>
            <a href="/transacties" className="text-sm text-[#0179FE] font-medium hover:underline">Alles bekijken →</a>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : transacties.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📊</p>
              <p className="font-medium text-gray-600">Nog geen transacties</p>
              <p className="text-sm">Ga naar Transacties om te beginnen</p>
            </div>
          ) : transacties.slice(0,8).map(t => {
            const cat = CATS[t.category] || CATS.default;
            return (
              <div key={t.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: cat.bg }}>{cat.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{t.description}</div>
                  <div className="text-xs text-gray-400">{t.category} · {fmtDate(t.date)}</div>
                </div>
                <div className={\`font-mono text-sm font-bold \${t.type==='income'?'text-green-600':'text-red-500'}\`}>
                  {t.type==='income'?'+':'-'}{fmt(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <RightPanel rekeningen={rekeningen} budgetten={budgetten} schulden={schulden} doelen={doelen} transacties={transacties} />
    </div>
  );
}
