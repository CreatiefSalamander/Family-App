'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { Plus, TrendingDown } from 'lucide-react';
import type { Schuld } from '@/types';

const fmtEuro = (n:number) => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n);
const fmtDate = (d:string) => d ? new Date(d).toLocaleDateString('nl-NL',{month:'short',year:'numeric'}) : '—';

// Geen voorbeelddata — schulden worden opgehaald uit jouw eigen Supabase account

export default function SchuldenPage() {
  const { t } = useLang();
  const [sch, setSch] = useState<Schuld[]>([]);
  const [load, setLoad] = useState(true);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ schuldeiser:'', type:'', oorspronkelijk:'', maandtermijn:'', kleur:'#EF4444' });
  const sb = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('schulden').select('*').eq('user_id', user.id).order('oorspronkelijk', { ascending:false });
      setSch((data||[]) as unknown as Schuld[]);
      setLoad(false);
    })();
  }, []);

  const totaalRest    = sch.reduce((s,d)=>s+(d.oorspronkelijk-d.afgelost),0);
  const totaalMaand   = sch.reduce((s,d)=>s+d.maandtermijn,0);
  const actief        = sch.filter(d=>d.status==='Actief').length;

  async function addSch() {
    setSaving(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data } = await sb.from('schulden').insert({
      user_id:user.id, schuldeiser:form.schuldeiser, type:form.type,
      oorspronkelijk:parseFloat(form.oorspronkelijk)||0, afgelost:0,
      maandtermijn:parseFloat(form.maandtermijn)||0, kleur:form.kleur,
      status:'Actief',
    }).select().single();
    if (data) setSch(prev=>[...prev, data as unknown as Schuld]);
    setShow(false); setSaving(false);
    setForm({ schuldeiser:'', type:'', oorspronkelijk:'', maandtermijn:'', kleur:'#EF4444' });
  }

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h1 className="header-box-title">{t.debts.title}</h1>
            <p className="header-box-subtext">{t.debts.subtitle}</p>
          </div>
          <button className="btn-primary" style={{ fontSize:13 }} onClick={()=>setShow(true)}><Plus size={15}/> {t.debts.add}</button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:t.debts.total,   value:fmtEuro(totaalRest),  color:'#EF4444', border:'#EF4444', bg:'#FEF2F2' },
          { label:t.debts.monthly, value:fmtEuro(totaalMaand), color:'#F59E0B', border:'#F59E0B', bg:'#FFFBEB' },
          { label:t.debts.active,  value:actief+' regelingen', color:'#6172F3', border:'#6172F3', bg:'#F5F3FF' },
        ].map(k=>(
          <div key={k.label} className="kpi-card" style={{ borderLeftColor:k.border, background:k.bg }}>
            <p style={{ fontSize:10, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>{k.label}</p>
            <p className="amount" style={{ fontSize:22, color:k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Schulden lijst */}
      {load ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{ height:80, borderRadius:12 }}/>)}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {(sch.length>0 ? sch : []).map((s,i) => {
            const rest = s.oorspronkelijk - s.afgelost;
            const pct  = s.oorspronkelijk>0 ? (s.afgelost/s.oorspronkelijk)*100 : 0;
            return (
              <div key={s.id||i} className="card card-hover" style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:s.kleur||'#EF4444', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <TrendingDown size={20} color="white"/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                      <div>
                        <p style={{ fontSize:14, fontWeight:700, color:'#1A1F36' }}>{s.schuldeiser}</p>
                        <p style={{ fontSize:12, color:'#6B7280' }}>{s.type} {s.regeling?'· '+s.regeling:''}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p className="amount" style={{ fontSize:18, color:'#EF4444' }}>-{fmtEuro(rest)}</p>
                        <p style={{ fontSize:11, color:'#9CA3AF' }}>{fmtEuro(s.maandtermijn)}{t.common.per_month}</p>
                      </div>
                    </div>
                    <div className="progress-track" style={{ background:'#FEE2E2' }}>
                      <div className="progress-fill" style={{ width:pct+'%', background:'#22C55E' }}/>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                      <p style={{ fontSize:10, color:'#9CA3AF' }}>Afgelost: {fmtEuro(s.afgelost)}</p>
                      <p style={{ fontSize:10, color:'#9CA3AF' }}>Origineel: {fmtEuro(s.oorspronkelijk)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {sch.length===0 && (
            <div className="card" style={{ padding:48, textAlign:'center' }}>
              <p style={{ fontSize:36, marginBottom:8 }}>✅</p>
              <p style={{ fontWeight:600, color:'#4B5563' }}>Geen schulden gevonden</p>
              <p style={{ fontSize:13, color:'#9CA3AF', marginTop:4 }}>Voeg je schulden toe om ze bij te houden</p>
            </div>
          )}
        </div>
      )}

      {show&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={e=>e.target===e.currentTarget&&setShow(false)}>
          <div className="card" style={{ width:440, padding:28 }}>
            <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, marginBottom:20 }}>{t.debts.add}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input className="input-field" placeholder="Schuldeiser" value={form.schuldeiser} onChange={e=>setForm(f=>({...f,schuldeiser:e.target.value}))}/>
                <input className="input-field" placeholder="Type (bijv. Lening)" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input className="input-field" type="number" placeholder="Totaalbedrag (€)" value={form.oorspronkelijk} onChange={e=>setForm(f=>({...f,oorspronkelijk:e.target.value}))}/>
                <input className="input-field" type="number" placeholder="Maandtermijn (€)" value={form.maandtermijn} onChange={e=>setForm(f=>({...f,maandtermijn:e.target.value}))}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={()=>setShow(false)}>{t.common.cancel}</button>
                <button className="btn-primary" style={{ flex:1 }} onClick={addSch} disabled={saving}>{saving?t.common.loading:t.common.add}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
