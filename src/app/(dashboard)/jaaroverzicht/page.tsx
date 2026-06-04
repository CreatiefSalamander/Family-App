'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { BarChart2 } from 'lucide-react';
import type { Transactie } from '@/types';

const fmtEuro = (n:number) => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n);
const MAANDEN = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

export default function JaaroverzichtPage() {
  const { t } = useLang();
  const [tx, setTx]   = useState<Transactie[]>([]);
  const [jaar, setJaar] = useState(new Date().getFullYear());
  const [load, setLoad] = useState(true);
  const sb = createClient();

  useEffect(()=>{
    (async()=>{
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('transactions').select('*').eq('user_id',user.id);
      setTx((data||[]) as unknown as Transactie[]);
      setLoad(false);
    })();
  },[]);

  const maandData = MAANDEN.map((_,m)=>{
    const mTx = tx.filter(x=>{ const d=new Date(x.date); return d.getFullYear()===jaar&&d.getMonth()===m; });
    const inc = mTx.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0);
    const exp = mTx.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0);
    return { maand:MAANDEN[m], inc, exp, net:inc-exp };
  });

  const maxVal = Math.max(...maandData.map(m=>Math.max(m.inc,m.exp)), 100);
  const totInc = maandData.reduce((s,m)=>s+m.inc,0);
  const totExp = maandData.reduce((s,m)=>s+m.exp,0);

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h1 className="header-box-title">{t.annual.title}</h1>
            <p className="header-box-subtext">{t.annual.subtitle}</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[jaar-1, jaar, jaar+1].filter(y=>y<=new Date().getFullYear()).map(y=>(
              <button key={y} onClick={()=>setJaar(y)} style={{ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, background:jaar===y?'#0179FE':'#F3F4F6', color:jaar===y?'#fff':'#6B7280' }}>{y}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI totalen */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:`${t.annual.income} ${jaar}`,  value:totInc, color:'#22C55E' },
          { label:`${t.annual.expenses} ${jaar}`, value:totExp, color:'#EF4444' },
          { label:`${t.annual.net} ${jaar}`,      value:totInc-totExp, color:(totInc-totExp)>=0?'#22C55E':'#EF4444' },
        ].map(k=>(
          <div key={k.label} className="card" style={{ padding:20 }}>
            <p style={{ fontSize:11, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>{k.label}</p>
            <p className="amount" style={{ fontSize:22, color:k.color }}>{fmtEuro(k.value)}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:20 }}>Maandelijks overzicht</h3>
        <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:180 }}>
          {maandData.map((m,i)=>(
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{ width:'100%', display:'flex', gap:2, alignItems:'flex-end', height:150 }}>
                <div title={`Inkomsten: ${fmtEuro(m.inc)}`} style={{ flex:1, background:'#22C55E', borderRadius:'4px 4px 0 0', height:m.inc>0?Math.max(4,(m.inc/maxVal)*150):2, transition:'height .5s ease', opacity:.85 }}/>
                <div title={`Uitgaven: ${fmtEuro(m.exp)}`} style={{ flex:1, background:'#EF4444', borderRadius:'4px 4px 0 0', height:m.exp>0?Math.max(4,(m.exp/maxVal)*150):2, transition:'height .5s ease', opacity:.85 }}/>
              </div>
              <p style={{ fontSize:10, color:'#9CA3AF', fontWeight:600 }}>{m.maand}</p>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:16, marginTop:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:12, height:12, borderRadius:2, background:'#22C55E' }}/><p style={{ fontSize:12, color:'#6B7280' }}>Inkomsten</p></div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:12, height:12, borderRadius:2, background:'#EF4444' }}/><p style={{ fontSize:12, color:'#6B7280' }}>Uitgaven</p></div>
        </div>
      </div>

      {/* Maandtabel */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 1fr 1fr', gap:12, padding:'10px 20px', borderBottom:'1px solid #F3F4F6', background:'#F9FAFB' }}>
          {[t.annual.month, t.annual.income, t.annual.expenses, t.annual.net].map(h=>(
            <p key={h} style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</p>
          ))}
        </div>
        {maandData.map((m,i)=>(
          <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr 1fr 1fr', gap:12, padding:'11px 20px', borderBottom:'1px solid #F9FAFB' }}
            onMouseEnter={e=>(e.currentTarget.style.background='#F9FAFB')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{m.maand}</p>
            <p className="amount" style={{ fontSize:13, color:'#22C55E' }}>{m.inc>0?fmtEuro(m.inc):'-'}</p>
            <p className="amount" style={{ fontSize:13, color:'#EF4444' }}>{m.exp>0?fmtEuro(m.exp):'-'}</p>
            <p className="amount" style={{ fontSize:13, color:m.net>=0?'#22C55E':'#EF4444' }}>{m.inc>0||m.exp>0?fmtEuro(m.net):'-'}</p>
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 1fr 1fr', gap:12, padding:'12px 20px', background:'#F9FAFB', borderTop:'2px solid #E5E7EB' }}>
          <p style={{ fontSize:13, fontWeight:700 }}>Totaal</p>
          <p className="amount" style={{ fontSize:13, fontWeight:700, color:'#22C55E' }}>{fmtEuro(totInc)}</p>
          <p className="amount" style={{ fontSize:13, fontWeight:700, color:'#EF4444' }}>{fmtEuro(totExp)}</p>
          <p className="amount" style={{ fontSize:13, fontWeight:700, color:(totInc-totExp)>=0?'#22C55E':'#EF4444' }}>{fmtEuro(totInc-totExp)}</p>
        </div>
      </div>
    </div>
  );
}
