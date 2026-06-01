'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { Plus } from 'lucide-react';
import type { Budget, Transactie } from '@/types';

const fmtEuro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
const CATS = ['Boodschappen','Eten','Transport','Wonen','Gezondheid','Abonnement','Kleding','Sport','Belasting','Verzekering','Overig'];
const CAT_ICON: Record<string,string> = { Boodschappen:'🛒', Eten:'🍔', Transport:'🚗', Wonen:'🏠', Gezondheid:'💊', Abonnement:'📱', Kleding:'👕', Sport:'🏋️', Belasting:'🏛️', Verzekering:'🛡️', Overig:'📄' };

export default function BegrotingPage() {
  const { t } = useLang();
  const [bud, setBud] = useState<Budget[]>([]);
  const [tx, setTx]   = useState<Transactie[]>([]);
  const [load, setLoad] = useState(true);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: 'Boodschappen', monthly_limit: '' });
  const sb = createClient();
  const now = new Date();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const [b, x] = await Promise.all([
        sb.from('budgets').select('*').eq('user_id', user.id),
        sb.from('transactions').select('*').eq('user_id', user.id),
      ]);
      setBud((b.data||[]) as unknown as Budget[]);
      setTx((x.data||[]) as unknown as Transactie[]);
      setLoad(false);
    })();
  }, []);

  const mTx = tx.filter(x => {
    const d = new Date(x.date);
    return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear() && x.type==='expense';
  });

  const budMet = bud.map(b => ({
    ...b,
    werkelijk: mTx.filter(x=>x.category===b.category).reduce((s,x)=>s+x.amount,0),
  }));

  const totLimiet  = bud.reduce((s,b)=>s+b.monthly_limit,0);
  const totBesteed = budMet.reduce((s,b)=>s+b.werkelijk,0);
  const totPct     = totLimiet>0 ? Math.min(100,(totBesteed/totLimiet)*100) : 0;

  async function addBud() {
    setSaving(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data } = await sb.from('budgets').insert({ user_id:user.id, category:form.category, monthly_limit:parseFloat(form.monthly_limit)||0 }).select().single();
    if (data) setBud(prev=>[...prev, data as unknown as Budget]);
    setShow(false); setSaving(false);
    setForm({ category:'Boodschappen', monthly_limit:'' });
  }

  const kleur = (pct:number) => pct<70?'#22C55E':pct<90?'#F59E0B':'#EF4444';

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h1 className="header-box-title">{t.budget.title}</h1>
            <p className="header-box-subtext">{t.budget.subtitle}</p>
          </div>
          <button className="btn-primary" style={{ fontSize:13 }} onClick={()=>setShow(true)}><Plus size={15}/> {t.budget.add}</button>
        </div>
      </div>

      {/* Totaal overzicht */}
      {bud.length>0 && (
        <div className="card card-hover" style={{ padding:24, marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <p style={{ fontSize:13, color:'#6B7280', fontWeight:600 }}>Totaal budget</p>
              <p className="amount" style={{ fontSize:24, color:'#1A1F36' }}>{fmtEuro(totLimiet)}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:13, color:'#6B7280', fontWeight:600 }}>Besteed</p>
              <p className="amount" style={{ fontSize:24, color:kleur(totPct) }}>{fmtEuro(totBesteed)}</p>
            </div>
          </div>
          <div className="progress-track" style={{ height:10 }}>
            <div className="progress-fill" style={{ width:totPct+'%', background:kleur(totPct) }}/>
          </div>
          <p style={{ fontSize:12, color:'#6B7280', marginTop:6 }}>{Math.round(totPct)}% van budget besteed</p>
        </div>
      )}

      {/* Budget grid */}
      {load ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
          {[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{ height:120, borderRadius:12 }}/>)}
        </div>
      ) : budMet.length===0 ? (
        <div className="card" style={{ padding:48, textAlign:'center' }}>
          <p style={{ fontSize:36, marginBottom:8 }}>📊</p>
          <p style={{ fontWeight:600, color:'#4B5563', marginBottom:4 }}>{t.budget.no_budgets}</p>
          <button className="btn-primary" style={{ marginTop:16, width:'auto' }} onClick={()=>setShow(true)}>{t.budget.add}</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
          {budMet.map(b => {
            const pct = b.monthly_limit>0 ? Math.min(100,(b.werkelijk/b.monthly_limit)*100) : 0;
            const k   = kleur(pct);
            return (
              <div key={b.id} className="card card-hover" style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                    {CAT_ICON[b.category]||'📄'}
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:'#1A1F36' }}>{b.category}</p>
                    <p style={{ fontSize:11, color:'#9CA3AF' }}>{t.budget.spent}: {fmtEuro(b.werkelijk)}</p>
                  </div>
                  <span className="badge" style={{ marginLeft:'auto', background:pct<70?'#F0FDF4':pct<90?'#FFFBEB':'#FEF2F2', color:k }}>{Math.round(pct)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width:pct+'%', background:k }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <p style={{ fontSize:11, color:'#6B7280' }}>{fmtEuro(b.werkelijk)} besteed</p>
                  <p style={{ fontSize:11, color:'#6B7280' }}>{fmtEuro(b.monthly_limit)} limiet</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {show&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={e=>e.target===e.currentTarget&&setShow(false)}>
          <div className="card" style={{ width:380, padding:28 }}>
            <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, marginBottom:20 }}>{t.budget.add}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <select className="input-field" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
              <input className="input-field" type="number" placeholder="Maandlimiet (€)" value={form.monthly_limit} onChange={e=>setForm(f=>({...f,monthly_limit:e.target.value}))}/>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={()=>setShow(false)}>{t.common.cancel}</button>
                <button className="btn-primary" style={{ flex:1 }} onClick={addBud} disabled={saving}>{saving?t.common.loading:t.common.add}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
