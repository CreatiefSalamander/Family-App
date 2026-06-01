'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { Briefcase, TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react';
import type { Transactie } from '@/types';

const fmtEuro = (n:number) => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n);

// Opdrachtgevers en kosten worden geladen uit jouw zakelijke transacties
// Voeg ze toe via de Transacties pagina met type "Zakelijk"
const OPDRACHTGEVERS: { naam:string; bedrag:number; type:string }[] = [];
const VASTE_KOSTEN:   { naam:string; bedrag:number }[]              = [];

export default function ZakelijkPage() {
  const { t } = useLang();
  const [tx, setTx] = useState<Transactie[]>([]);
  const [load, setLoad] = useState(true);
  const sb = createClient();
  const now = new Date();

  useEffect(()=>{
    (async()=>{
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('transactions').select('*').eq('user_id',user.id).eq('is_zakelijk',true).order('date',{ascending:false});
      setTx((data||[]) as unknown as Transactie[]);
      setLoad(false);
    })();
  },[]);

  const mTx   = tx.filter(x=>{ const d=new Date(x.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); });
  const omzet = OPDRACHTGEVERS.reduce((s,o)=>s+o.bedrag,0);
  const kosten = VASTE_KOSTEN.reduce((s,k)=>s+k.bedrag,0);
  const btw    = Math.round(omzet * 0.21);
  const winst  = omzet - kosten;

  const kpis = [
    { label:t.business.revenue, value:fmtEuro(omzet),  color:'#22C55E', border:'#22C55E', bg:'#F0FDF4' },
    { label:t.business.vat,     value:fmtEuro(btw),    color:'#F59E0B', border:'#F59E0B', bg:'#FFFBEB' },
    { label:t.business.profit,  value:fmtEuro(winst),  color:'#0179FE', border:'#0179FE', bg:'#EFF6FF' },
    { label:t.business.costs,   value:fmtEuro(kosten), color:'#EF4444', border:'#EF4444', bg:'#FEF2F2' },
  ];

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#6172F3,#A855F7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Briefcase size={22} color="white"/>
          </div>
          <div>
            <h1 className="header-box-title">{t.business.title}</h1>
            <p className="header-box-subtext">{t.business.subtitle}</p>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:16, marginBottom:24 }}>
        {kpis.map(k=>(
          <div key={k.label} className="kpi-card" style={{ borderLeftColor:k.border, background:k.bg }}>
            <p style={{ fontSize:10, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>{k.label}</p>
            <p className="amount" style={{ fontSize:20, color:k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        {/* Opdrachtgevers */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:16 }}>{t.business.clients}</h3>
          {OPDRACHTGEVERS.map(o=>(
            <div key={o.naam} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{o.naam}</p>
                <p style={{ fontSize:11, color:'#9CA3AF' }}>{o.type}</p>
              </div>
              <p className="amount" style={{ fontSize:14, color:'#22C55E' }}>+{fmtEuro(o.bedrag)}</p>
            </div>
          ))}
        </div>

        {/* Vaste kosten */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:16 }}>Vaste kosten</h3>
          {VASTE_KOSTEN.map(k=>(
            <div key={k.naam} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
              <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{k.naam}</p>
              <p className="amount" style={{ fontSize:14, color:'#EF4444' }}>-{fmtEuro(k.bedrag)}</p>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, padding:'10px 0', borderTop:'2px solid #E5E7EB' }}>
            <p style={{ fontSize:13, fontWeight:700 }}>Totaal</p>
            <p className="amount" style={{ fontSize:14, color:'#EF4444', fontWeight:700 }}>-{fmtEuro(kosten)}</p>
          </div>
        </div>
      </div>

      {/* BTW berekening */}
      <div className="card" style={{ padding:24, background:'linear-gradient(135deg,#1A1F36,#374151)', border:'none' }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:16 }}>BTW Berekening (21%)</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {[
            { label:'Omzet excl. BTW', value:fmtEuro(omzet) },
            { label:'BTW bedrag (21%)', value:fmtEuro(btw) },
            { label:'Af te dragen', value:fmtEuro(btw) },
          ].map(r=>(
            <div key={r.label}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,.65)', fontWeight:600, marginBottom:4 }}>{r.label}</p>
              <p className="amount" style={{ fontSize:18, color:'#fff' }}>{r.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
