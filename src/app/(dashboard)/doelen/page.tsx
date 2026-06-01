'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmt, fmtDate } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import type { Doel } from '@/types';

export default function DoelenPage() {
  const [doelen, setDoelen] = useState<Doel[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showDep, setShowDep] = useState<string|null>(null);
  const [depAmt, setDepAmt] = useState('');
  const [form, setForm] = useState({ name:'', emoji:'🎯', target_amount:'', current_amount:'', deadline:'' });
  const sb = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data } = await sb.from('goals').select('*').eq('user_id', user.id);
    setDoelen((data||[]) as unknown as Doel[]);
  }

  async function saveDoel() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !form.name || !form.target_amount) return;
    const d = { user_id: user.id, name: form.name, emoji: form.emoji, target_amount: parseFloat(form.target_amount), current_amount: parseFloat(form.current_amount)||0, deadline: form.deadline||null };
    const { data } = await sb.from('goals').insert(d).select().single();
    if (data) { setDoelen(prev=>[...prev, data as unknown as Doel]); setShowAdd(false); }
  }

  async function saveDeposit() {
    if (!showDep || !depAmt) return;
    const amt = parseFloat(depAmt);
    const doel = doelen.find(d=>d.id===showDep);
    if (!doel) return;
    const nieuw = doel.current_amount + amt;
    await sb.from('goals').update({ current_amount: nieuw }).eq('id', showDep);
    setDoelen(prev => prev.map(d => d.id===showDep ? {...d, current_amount:nieuw} : d));
    setShowDep(null); setDepAmt('');
  }

  return (
    <div className="px-7 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Doelen</h1>
        <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 gradient-blue text-white px-4 py-2 rounded-lg text-sm font-semibold"><Plus size={16}/>Nieuw doel</button>
      </div>

      {doelen.length === 0 ? (
        <div className="card p-16 text-center text-gray-400"><p className="text-4xl mb-3">🎯</p><p className="font-semibold text-gray-600">Maak je eerste spaardoel aan</p><button onClick={()=>setShowAdd(true)} className="mt-4 gradient-blue text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Toevoegen</button></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doelen.map(g => {
            const pct = g.target_amount > 0 ? Math.min(100,(g.current_amount/g.target_amount)*100) : 0;
            const r = 36, circ = 2*Math.PI*r;
            const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime()-Date.now())/86400000) : null;
            return (
              <div key={g.id} className="card p-6 text-center hover:border-blue-200 transition-all">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <svg className="-rotate-90 w-20 h-20">
                    <circle cx="40" cy="40" r={r} fill="none" stroke="#F3F4F6" strokeWidth="6"/>
                    <circle cx="40" cy="40" r={r} fill="none" stroke="#0179FE" strokeWidth="6" strokeDasharray={\`\${circ*(pct/100)} \${circ*(1-pct/100)}\`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">{g.emoji}</div>
                </div>
                <h3 className="font-display font-bold text-base mb-1">{g.name}</h3>
                <p className="font-mono text-sm text-gray-500 mb-3">{fmt(g.current_amount)} / {fmt(g.target_amount)}</p>
                {daysLeft !== null && <p className="text-xs text-gray-400 mb-3">{daysLeft > 0 ? daysLeft+' dagen resterend' : 'Deadline verstreken'}</p>}
                <button onClick={()=>setShowDep(g.id)} className="w-full gradient-blue text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90">+ Storting</button>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={()=>setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-lg">Nieuw doel</h2><button onClick={()=>setShowAdd(false)}><X size={20}/></button></div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-sm font-medium block mb-1">Naam</label><input type="text" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Vakantie, Auto..." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"/></div>
                <div className="w-24"><label className="text-sm font-medium block mb-1">Emoji</label><input type="text" value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-center focus:outline-none" maxLength={2}/></div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-sm font-medium block mb-1">Doelbedrag (€)</label><input type="number" value={form.target_amount} onChange={e=>setForm(f=>({...f,target_amount:e.target.value}))} placeholder="5000" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"/></div>
                <div className="flex-1"><label className="text-sm font-medium block mb-1">Huidig (€)</label><input type="number" value={form.current_amount} onChange={e=>setForm(f=>({...f,current_amount:e.target.value}))} placeholder="0" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none"/></div>
              </div>
              <div><label className="text-sm font-medium block mb-1">Deadline</label><input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none"/></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowAdd(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold">Annuleren</button>
              <button onClick={saveDoel} className="flex-1 gradient-blue text-white rounded-lg py-2.5 text-sm font-semibold">Opslaan</button>
            </div>
          </div>
        </div>
      )}

      {showDep && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={()=>setShowDep(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">Storting toevoegen</h2>
            <input type="number" value={depAmt} onChange={e=>setDepAmt(e.target.value)} placeholder="Bedrag in €" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-lg font-mono font-bold focus:outline-none focus:border-blue-400 mb-4"/>
            <div className="flex gap-3">
              <button onClick={()=>setShowDep(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold">Annuleren</button>
              <button onClick={saveDeposit} className="flex-1 gradient-blue text-white rounded-lg py-2.5 text-sm font-semibold">Opslaan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
