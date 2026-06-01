'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { Plus, Target } from 'lucide-react';
import type { Doel } from '@/types';

const fmtEuro = (n:number) => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n);
const EMOJIS = ['🎯','🏠','🚗','✈️','💍','🎓','💰','🏋️','🌴','📱','💻','🎵'];

export default function DoelenPage() {
  const { t } = useLang();
  const [doelen, setDoelen] = useState<Doel[]>([]);
  const [load, setLoad]   = useState(true);
  const [show, setShow]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]   = useState({ name:'', emoji:'🎯', target_amount:'', current_amount:'', deadline:'' });
  const sb = createClient();

  useEffect(()=>{
    (async()=>{
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('goals').select('*').eq('user_id',user.id).order('deadline',{ascending:true,nullsFirst:false});
      setDoelen((data||[]) as unknown as Doel[]);
      setLoad(false);
    })();
  },[]);

  async function addDoel() {
    setSaving(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data } = await sb.from('goals').insert({
      user_id:user.id, name:form.name, emoji:form.emoji,
      target_amount:parseFloat(form.target_amount)||0,
      current_amount:parseFloat(form.current_amount)||0,
      deadline:form.deadline||null,
    }).select().single();
    if (data) setDoelen(prev=>[...prev, data as unknown as Doel]);
    setShow(false); setSaving(false);
    setForm({ name:'', emoji:'🎯', target_amount:'', current_amount:'', deadline:'' });
  }

  const totaalDoel    = doelen.reduce((s,d)=>s+d.target_amount,0);
  const totaalBereikt = doelen.reduce((s,d)=>s+d.current_amount,0);

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h1 className="header-box-title">{t.goals.title}</h1>
            <p className="header-box-subtext">{t.goals.subtitle}</p>
          </div>
          <button className="btn-primary" style={{ fontSize:13 }} onClick={()=>setShow(true)}><Plus size={15}/> {t.goals.add}</button>
        </div>
      </div>

      {/* Overzicht */}
      {doelen.length>0 && (
        <div className="total-balance fade-up" style={{ marginBottom:28 }}>
          <div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,.75)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>Totaal spaardoel</p>
            <p className="amount" style={{ fontSize:34, color:'#fff' }}>{fmtEuro(totaalDoel)}</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,.75)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>Bereikt</p>
            <p className="amount" style={{ fontSize:24, color:'#fff' }}>{fmtEuro(totaalBereikt)}</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,.65)' }}>
              {totaalDoel>0 ? Math.round((totaalBereikt/totaalDoel)*100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Doelen grid */}
      {load ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{ height:180, borderRadius:12 }}/>)}
        </div>
      ) : doelen.length===0 ? (
        <div className="card" style={{ padding:48, textAlign:'center' }}>
          <Target size={48} color="#E5E7EB" style={{ margin:'0 auto 16px' }}/>
          <p style={{ fontWeight:600, color:'#4B5563', marginBottom:4 }}>{t.goals.no_goals}</p>
          <button className="btn-primary" style={{ marginTop:16, width:'auto' }} onClick={()=>setShow(true)}>{t.goals.add}</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {doelen.map(d => {
            const pct  = d.target_amount>0 ? Math.min(100,(d.current_amount/d.target_amount)*100) : 0;
            const rest = d.target_amount - d.current_amount;
            const daysLeft = d.deadline ? Math.max(0,Math.ceil((new Date(d.deadline).getTime()-Date.now())/(1000*60*60*24))) : null;
            return (
              <div key={d.id} className="card card-hover" style={{ padding:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
                    {d.emoji||'🎯'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:15, fontWeight:700, color:'#1A1F36', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</p>
                    {daysLeft!==null && (
                      <span className="badge badge-blue" style={{ marginTop:4 }}>{daysLeft} dagen</span>
                    )}
                  </div>
                </div>

                {/* Cirkel progress */}
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" style={{ flexShrink:0 }}>
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#F3F4F6" strokeWidth="8"/>
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#0179FE" strokeWidth="8"
                      strokeDasharray={`${2*Math.PI*30}`}
                      strokeDashoffset={`${2*Math.PI*30*(1-pct/100)}`}
                      strokeLinecap="round" transform="rotate(-90 36 36)"
                      style={{ transition:'stroke-dashoffset .8s ease' }}/>
                    <text x="36" y="40" textAnchor="middle" fill="#1A1F36" fontSize="14" fontWeight="700">{Math.round(pct)}%</text>
                  </svg>
                  <div>
                    <p className="amount" style={{ fontSize:20, color:'#1A1F36' }}>{fmtEuro(d.current_amount)}</p>
                    <p style={{ fontSize:12, color:'#6B7280' }}>{t.common.of} {fmtEuro(d.target_amount)}</p>
                    <p style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>Nog {fmtEuro(rest)} te gaan</p>
                  </div>
                </div>

                <div className="progress-track">
                  <div className="progress-fill" style={{ width:pct+'%', background:'#0179FE' }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {show&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={e=>e.target===e.currentTarget&&setShow(false)}>
          <div className="card" style={{ width:440, padding:28 }}>
            <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, marginBottom:20 }}>{t.goals.add}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Emoji</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {EMOJIS.map(e=>(
                    <button key={e} onClick={()=>setForm(f=>({...f,emoji:e}))} style={{ width:38, height:38, borderRadius:8, border:form.emoji===e?'2px solid #0179FE':'2px solid #E5E7EB', background:form.emoji===e?'#EFF6FF':'white', cursor:'pointer', fontSize:20 }}>{e}</button>
                  ))}
                </div>
              </div>
              <input className="input-field" placeholder="Naam doel" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input className="input-field" type="number" placeholder="Doelbedrag (€)" value={form.target_amount} onChange={e=>setForm(f=>({...f,target_amount:e.target.value}))}/>
                <input className="input-field" type="number" placeholder="Al gespaard (€)" value={form.current_amount} onChange={e=>setForm(f=>({...f,current_amount:e.target.value}))}/>
              </div>
              <input className="input-field" type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))}/>
              <div style={{ display:'flex', gap:10, marginTop:6 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={()=>setShow(false)}>{t.common.cancel}</button>
                <button className="btn-primary" style={{ flex:1 }} onClick={addDoel} disabled={saving}>{saving?t.common.loading:t.common.add}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
