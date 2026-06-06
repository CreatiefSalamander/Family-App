'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { Briefcase, Plus, Edit2, Trash2, Car } from 'lucide-react';

const fmtEuro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

interface Opdrachtgever { id:string; naam:string; bedrag_ex_btw:number; btw_percentage:number; status:string; notitie:string; }
interface ZakelijkeKost { id:string; naam:string; bedrag:number; type:string; notitie:string; }

export default function ZakelijkPage() {
  const { t } = useLang();
  const [opdr,  setOpdr]  = useState<Opdrachtgever[]>([]);
  const [kost,  setKost]  = useState<ZakelijkeKost[]>([]);
  const [load,  setLoad]  = useState(true);
  const [showO, setShowO] = useState(false);
  const [showK, setShowK] = useState(false);
  const [saving, setSave] = useState(false);
  const [formO, setFormO] = useState({ naam:'', bedrag_ex_btw:'', btw_percentage:'21', status:'Actief' });
  const [formK, setFormK] = useState({ naam:'', bedrag:'', type:'Vast' });
  const sb = createClient();

  const [dbMissing, setDbMissing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const [o, k] = await Promise.all([
        sb.from('opdrachtgevers').select('*').eq('user_id', user.id).order('naam'),
        sb.from('zakelijke_kosten').select('*').eq('user_id', user.id).order('naam'),
      ]);
      // Tabel bestaat nog niet — toon setup instructie
      if (o.error?.code === 'PGRST205' || k.error?.code === 'PGRST205') {
        setDbMissing(true); setLoad(false); return;
      }
      setOpdr((o.data || []) as Opdrachtgever[]);
      setKost((k.data || []) as ZakelijkeKost[]);
      setLoad(false);
    })();
  }, []);

  /* BTW berekeningen */
  const omzetExBtw  = opdr.filter(o => o.status === 'Actief').reduce((s, o) => s + o.bedrag_ex_btw, 0);
  const btwOntvangen = opdr.filter(o => o.status === 'Actief').reduce((s, o) => s + o.bedrag_ex_btw * (o.btw_percentage / 100), 0);
  const totaleKosten = kost.reduce((s, k) => s + k.bedrag, 0);
  const nettoWinst   = omzetExBtw - totaleKosten;
  const btwAfdragen  = Math.max(0, btwOntvangen);

  async function addOpdr() {
    setSave(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSave(false); return; }
    const { data } = await sb.from('opdrachtgevers').insert({
      user_id: user.id,
      naam: formO.naam,
      bedrag_ex_btw: parseFloat(formO.bedrag_ex_btw) || 0,
      btw_percentage: parseFloat(formO.btw_percentage) || 21,
      status: formO.status,
    }).select().single();
    if (data) setOpdr(p => [...p, data as Opdrachtgever]);
    setShowO(false); setSave(false);
    setFormO({ naam:'', bedrag_ex_btw:'', btw_percentage:'21', status:'Actief' });
  }

  async function addKost() {
    setSave(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSave(false); return; }
    const { data } = await sb.from('zakelijke_kosten').insert({
      user_id: user.id, naam: formK.naam,
      bedrag: parseFloat(formK.bedrag) || 0, type: formK.type,
    }).select().single();
    if (data) setKost(p => [...p, data as ZakelijkeKost]);
    setShowK(false); setSave(false);
    setFormK({ naam:'', bedrag:'', type:'Vast' });
  }

  async function delOpdr(id: string) {
    await sb.from('opdrachtgevers').delete().eq('id', id);
    setOpdr(p => p.filter(o => o.id !== id));
  }

  async function delKost(id: string) {
    await sb.from('zakelijke_kosten').delete().eq('id', id);
    setKost(p => p.filter(k => k.id !== id));
  }

  const kpis = [
    { label:t.business.revenue, value:fmtEuro(omzetExBtw),   color:'#22C55E', border:'#22C55E', bg:'#F0FDF4' },
    { label:t.business.vat,     value:fmtEuro(btwAfdragen),  color:'#F59E0B', border:'#F59E0B', bg:'#FFFBEB' },
    { label:t.business.profit,  value:fmtEuro(nettoWinst),   color:nettoWinst>=0?'#0179FE':'#EF4444', border:nettoWinst>=0?'#0179FE':'#EF4444', bg:'#EFF6FF' },
    { label:t.business.costs,   value:fmtEuro(totaleKosten), color:'#EF4444', border:'#EF4444', bg:'#FEF2F2' },
  ];

  /* Tabel ontbreekt — toon setup instructie */
  if (dbMissing) return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <h1 className="header-box-title">{t.business.title}</h1>
        <p className="header-box-subtext">Eenmalige database setup vereist</p>
      </div>
      <div className="card" style={{ padding:32, maxWidth:600, background:'#FFFBEB', border:'1px solid #FDE68A' }}>
        <p style={{ fontSize:18, fontWeight:700, color:'#92400E', marginBottom:8 }}>⚙️ Database tabellen aanmaken</p>
        <p style={{ fontSize:13, color:'#78350F', marginBottom:20, lineHeight:1.6 }}>
          De zakelijk pagina heeft 2 nieuwe tabellen nodig. Dit doe je eenmalig in 3 stappen:
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
          {['Ga naar: supabase.com/dashboard/project/lttxjfrtfrjnlazmbcyq/sql/new', 'Plak de SQL die je van je ontwikkelaar hebt gekregen', 'Klik de groene Run knop'].map((stap,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'#F59E0B', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'white', fontSize:12, fontWeight:700 }}>{i+1}</div>
              <p style={{ fontSize:13, color:'#78350F', paddingTop:2 }}>{stap}</p>
            </div>
          ))}
        </div>
        <a href="https://supabase.com/dashboard/project/lttxjfrtfrjnlazmbcyq/sql/new" target="_blank"
          style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#F59E0B', color:'white', padding:'10px 20px', borderRadius:8, textDecoration:'none', fontWeight:600, fontSize:13 }}>
          → Open SQL Editor
        </a>
      </div>
    </div>
  );

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

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:16, marginBottom:24 }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card" style={{ borderLeftColor:k.border, background:k.bg }}>
            <p style={{ fontSize:10, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>{k.label}</p>
            <p className="amount" style={{ fontSize:20, color:k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* mobile-stack: 2-kolom op desktop, 1-kolom op mobiel */}
      <div className="mobile-stack" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        {/* Opdrachtgevers */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36' }}>{t.business.clients}</h3>
            <button className="btn-primary" style={{ fontSize:12, padding:'6px 12px' }} onClick={() => setShowO(true)}>
              <Plus size={14}/> Toevoegen
            </button>
          </div>
          {load ? (
            <div className="skeleton" style={{ height:80, borderRadius:10 }}/>
          ) : opdr.length === 0 ? (
            <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'16px 0' }}>Geen opdrachtgevers</p>
          ) : (
            opdr.map(o => (
              <div key={o.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{o.naam}</p>
                  <span className={`badge ${o.status==='Actief'?'badge-green':'badge-gray'}`} style={{ marginTop:3 }}>{o.status}</span>
                </div>
                <div style={{ textAlign:'right', display:'flex', alignItems:'center', gap:8 }}>
                  <div>
                    <p className="amount" style={{ fontSize:14, color:'#22C55E' }}>+{fmtEuro(o.bedrag_ex_btw)}</p>
                    <p style={{ fontSize:10, color:'#9CA3AF' }}>+{fmtEuro(o.bedrag_ex_btw*(o.btw_percentage/100))} BTW</p>
                  </div>
                  <button onClick={() => delOpdr(o.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:4 }}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Zakelijke kosten */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36' }}>Kosten</h3>
            <button className="btn-primary" style={{ fontSize:12, padding:'6px 12px' }} onClick={() => setShowK(true)}>
              <Plus size={14}/> Toevoegen
            </button>
          </div>
          {load ? (
            <div className="skeleton" style={{ height:80, borderRadius:10 }}/>
          ) : kost.length === 0 ? (
            <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'16px 0' }}>Geen kosten</p>
          ) : (
            <>
              {kost.map(k => (
                <div key={k.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{k.naam}</p>
                    <span className="badge badge-gray" style={{ marginTop:3 }}>{k.type}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <p className="amount" style={{ fontSize:14, color:'#EF4444' }}>-{fmtEuro(k.bedrag)}</p>
                    <button onClick={() => delKost(k.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:4 }}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, padding:'8px 0', borderTop:'2px solid #E5E7EB' }}>
                <p style={{ fontSize:13, fontWeight:700 }}>Totaal</p>
                <p className="amount" style={{ fontSize:13, fontWeight:700, color:'#EF4444' }}>-{fmtEuro(totaleKosten)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BTW overzicht */}
      <div className="card" style={{ padding:24, background:'linear-gradient(135deg,#1A1F36,#374151)', border:'none', marginBottom:20 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:16 }}>BTW Overzicht ({new Date().toLocaleDateString('nl-NL', { month:'long', year:'numeric' })})</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:16 }}>
          {[
            { label:'Omzet excl. BTW', value:fmtEuro(omzetExBtw) },
            { label:'BTW te ontvangen (21%)', value:fmtEuro(btwOntvangen) },
            { label:'Kosten excl. BTW', value:fmtEuro(totaleKosten) },
            { label:'Netto winst', value:fmtEuro(nettoWinst) },
            { label:'BTW af te dragen', value:fmtEuro(btwAfdragen) },
          ].map(r => (
            <div key={r.label}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,.6)', fontWeight:600, marginBottom:4 }}>{r.label}</p>
              <p className="amount" style={{ fontSize:16, color:'#fff' }}>{r.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showO && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={e => e.target===e.currentTarget && setShowO(false)}>
          <div className="card" style={{ width:400, padding:28 }}>
            <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, marginBottom:20 }}>Opdrachtgever toevoegen</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <input className="input-field" placeholder="Naam" value={formO.naam} onChange={e => setFormO(f=>({...f,naam:e.target.value}))}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:12 }}>
                <input className="input-field" type="number" placeholder="Bedrag ex BTW (€/mnd)" value={formO.bedrag_ex_btw} onChange={e => setFormO(f=>({...f,bedrag_ex_btw:e.target.value}))}/>
                <input className="input-field" type="number" placeholder="BTW %" value={formO.btw_percentage} onChange={e => setFormO(f=>({...f,btw_percentage:e.target.value}))}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={() => setShowO(false)}>Annuleren</button>
                <button className="btn-primary" style={{ flex:1 }} onClick={addOpdr} disabled={saving}>{saving?'Bezig...':'Toevoegen'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showK && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={e => e.target===e.currentTarget && setShowK(false)}>
          <div className="card" style={{ width:400, padding:28 }}>
            <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, marginBottom:20 }}>Kost toevoegen</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <input className="input-field" placeholder="Naam" value={formK.naam} onChange={e => setFormK(f=>({...f,naam:e.target.value}))}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:12 }}>
                <input className="input-field" type="number" placeholder="Bedrag (€/mnd)" value={formK.bedrag} onChange={e => setFormK(f=>({...f,bedrag:e.target.value}))}/>
                <select className="input-field" value={formK.type} onChange={e => setFormK(f=>({...f,type:e.target.value}))}>
                  <option>Vast</option><option>Variabel</option><option>Eenmalig</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={() => setShowK(false)}>Annuleren</button>
                <button className="btn-primary" style={{ flex:1 }} onClick={addKost} disabled={saving}>{saving?'Bezig...':'Toevoegen'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
