'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmt, fmtMonth } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import type { Budget, Transactie } from '@/types';

const CATS = ['Boodschappen','Eten','Transport','Wonen','Gezondheid','Vrije tijd','Kleding','Abonnementen','Zakelijk','Salaris','Overig'];
const DEFAULT_BUDGETS = [
  {category:'Wonen',monthly_limit:290},{category:'Boodschappen',monthly_limit:500},
  {category:'Transport',monthly_limit:150},{category:'Vrije tijd',monthly_limit:150},
  {category:'Zorgverzekering',monthly_limit:180},{category:'Telefoon',monthly_limit:140},
];

export default function BegrotingPage() {
  const [budgetten, setBudgetten] = useState<Budget[]>([]);
  const [transacties, setTransacties] = useState<Transactie[]>([]);
  const [maand, setMaand] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'Boodschappen', monthly_limit: '' });
  const sb = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const [{ data: b }, { data: t }] = await Promise.all([
      sb.from('budgets').select('*').eq('user_id', user.id),
      sb.from('transactions').select('*').eq('user_id', user.id),
    ]);
    setBudgetten((b||[]) as unknown as Budget[]);
    setTransacties((t||[]) as unknown as Transactie[]);
  }

  const mTx = transacties.filter(t => { const d=new Date(t.date); return d.getMonth()===maand.getMonth()&&d.getFullYear()===maand.getFullYear()&&t.type==='expense'; });
  const totB = budgetten.reduce((s,b)=>s+b.monthly_limit,0);
  const totS = mTx.reduce((s,t)=>s+t.amount,0);
  const pct = totB>0?Math.min(100,(totS/totB)*100):0;

  async function saveBudget() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !form.monthly_limit) return;
    const lim = parseFloat(form.monthly_limit);
    const existing = budgetten.find(b=>b.category===form.category);
    if (existing) {
      await sb.from('budgets').update({ monthly_limit: lim }).eq('id', existing.id);
      setBudgetten(prev => prev.map(b=>b.category===form.category?{...b,monthly_limit:lim}:b));
    } else {
      const { data } = await sb.from('budgets').insert({ user_id: user.id, category: form.category, monthly_limit: lim }).select().single();
      if (data) setBudgetten(prev=>[...prev, data as unknown as Budget]);
    }
    setShowAdd(false);
  }

  const activeBudgets = budgetten.length > 0 ? budgetten : DEFAULT_BUDGETS.map((b,i) => ({...b, id:String(i), user_id:''}));

  return (
    <div className="px-7 py-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={()=>{ const d=new Date(maand); d.setMonth(d.getMonth()-1); setMaand(d); }} className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50"><ChevronLeft size={18}/></button>
        <h1 className="font-display text-2xl font-bold capitalize">{fmtMonth(maand)}</h1>
        <button onClick={()=>{ const d=new Date(maand); d.setMonth(d.getMonth()+1); setMaand(d); }} className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50"><ChevronRight size={18}/></button>
        <button onClick={()=>setShowAdd(true)} className="ml-auto flex items-center gap-2 gradient-blue text-white px-4 py-2 rounded-lg text-sm font-semibold"><Plus size={16}/>Toevoegen</button>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex justify-between mb-2">
          <div><p className="text-xs text-gray-400 mb-1">Budget</p><p className="font-mono text-2xl font-bold">{fmt(totB)}</p></div>
          <div className="text-right"><p className="text-xs text-gray-400 mb-1">Besteed</p><p className={\`font-mono text-2xl font-bold \${pct>90?'text-red-500':pct>70?'text-amber-500':'text-green-600'}\`}>{fmt(totS)}</p></div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={\`h-full rounded-full transition-all \${pct>90?'bg-red-500':pct>70?'bg-amber-400':'bg-green-500'}\`} style={{width:pct+'%'}} />
        </div>
        <p className="text-sm text-gray-400 mt-2">{Math.round(pct)}% van budget gebruikt</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeBudgets.map(b => {
          const sp = mTx.filter(t=>t.category===b.category).reduce((s,t)=>s+t.amount,0);
          const bp = b.monthly_limit>0?Math.min(100,(sp/b.monthly_limit)*100):0;
          const color = bp<70?'bg-green-500':bp<90?'bg-amber-400':'bg-red-500';
          return (
            <div key={b.category} className="card p-5 hover:border-blue-200 cursor-pointer transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><span className="text-lg">📊</span><span className="font-semibold text-sm">{b.category}</span></div>
                <span className={\`text-xs font-bold \${bp>90?'text-red-500':bp>70?'text-amber-500':'text-green-600'}\`}>{Math.round(bp)}%</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{fmt(sp)} van {fmt(b.monthly_limit)}</p>
              <div className="h-2 bg-gray-100 rounded-full"><div className={\`h-full rounded-full \${color}\`} style={{width:bp+'%'}} /></div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={()=>setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-lg">Budget instellen</h2><button onClick={()=>setShowAdd(false)}><X size={20}/></button></div>
            <div className="space-y-3">
              <div><label className="text-sm font-medium block mb-1">Categorie</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium block mb-1">Maandlimiet (€)</label>
                <input type="number" value={form.monthly_limit} onChange={e=>setForm(f=>({...f,monthly_limit:e.target.value}))} placeholder="250" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowAdd(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold">Annuleren</button>
              <button onClick={saveBudget} className="flex-1 gradient-blue text-white rounded-lg py-2.5 text-sm font-semibold">Opslaan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
