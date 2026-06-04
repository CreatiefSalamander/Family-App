'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plane, Search, Cloud, Loader2, ExternalLink, Plus } from 'lucide-react';

const fmtEuro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

interface Vlucht {
  vluchtnummer: string; maatschappij: string; status: string;
  vertrek: { luchthaven: string; iata: string; gepland: string; gate: string };
  aankomst: { luchthaven: string; iata: string; gepland: string; verwacht: string; gate: string };
  vertraging: number;
}
interface Weer { stad: string; temp: number; beschrijving: string; icoon: string; }
interface Reis { id: string; bestemming: string; vertrek_datum: string; terug_datum: string; budget: number; status: string; }

const STATUS_KLEUR: Record<string, string> = {
  scheduled: '#22C55E', active: '#0179FE', landed: '#6B7280',
  cancelled: '#EF4444', incident: '#EF4444', diverted: '#F59E0B',
};

function googleFlightsUrl(van: string, naar: string, datum: string) {
  return `https://www.google.com/flights?hl=nl#flt=${encodeURIComponent(van)}.${encodeURIComponent(naar)}.${datum};c:EUR;e:1;sd:1;t:f`;
}
function kiwiUrl(van: string, naar: string, datum: string) {
  return `https://www.kiwi.com/nl/search/results/${encodeURIComponent(van)}/${encodeURIComponent(naar)}/${datum}/no-return`;
}
function cheaptickets(van: string, naar: string) {
  return `https://www.cheaptickets.nl/vluchten/zoeken?from=${encodeURIComponent(van)}&to=${encodeURIComponent(naar)}`;
}

export default function ReizenPage() {
  const sb = createClient();
  /* Vlucht zoeken */
  const [vanStad, setVan]   = useState('Amsterdam');
  const [naarStad, setNaar] = useState('');
  const [datum, setDatum]   = useState(new Date(Date.now()+7*864e5).toISOString().split('T')[0]);
  const [aiAdvies, setAiAdvies] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  /* Vlucht tracker */
  const [vluchtnr,  setVluchtnr]  = useState('');
  const [vlucht,    setVlucht]    = useState<Vlucht | null>(null);
  const [vluchtLoad, setVluchtLoad] = useState(false);
  const [vluchtErr,  setVluchtErr]  = useState('');

  /* Weer */
  const [weerStad, setWeerStad] = useState('');
  const [weer,     setWeer]     = useState<Weer | null>(null);
  const [weerLoad, setWeerLoad] = useState(false);

  /* Mijn reizen */
  const [reizen, setReizen] = useState<Reis[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ bestemming:'', vertrek_datum:'', terug_datum:'', budget:'' });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('reizen').select('*').eq('user_id', user.id).order('vertrek_datum');
      setReizen((data ?? []) as Reis[]);
    })();
  }, []);

  async function zoekVlucht() {
    if (!vluchtnr.trim()) return;
    setVluchtLoad(true); setVluchtErr(''); setVlucht(null);
    const resp = await fetch('/api/vlucht-tracker', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ vluchtnummer: vluchtnr }) });
    const data = await resp.json();
    if (data.error) setVluchtErr(data.error);
    else { setVlucht(data); const recent = JSON.parse(localStorage.getItem('recente_vluchten')||'[]'); localStorage.setItem('recente_vluchten',JSON.stringify([vluchtnr,...recent.filter((v:string)=>v!==vluchtnr)].slice(0,5))); }
    setVluchtLoad(false);
  }

  async function haalWeer() {
    if (!weerStad.trim()) return;
    setWeerLoad(true);
    const resp = await fetch('/api/weer', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ stad: weerStad }) });
    const data = await resp.json();
    if (!data.error) setWeer({ stad: data.stad, temp: data.temp, beschrijving: data.beschrijving, icoon: data.icoon });
    setWeerLoad(false);
  }

  async function haalAiAdvies() {
    if (!naarStad.trim()) return;
    setAiLoading(true); setAiAdvies('');
    const resp = await fetch('/api/ai-chat', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        system: 'Je bent een reisadviseur. Geef praktisch reisadvies in het Nederlands. Houd het kort (max 150 woorden).',
        messages: [{ role:'user', content:`Geef reisadvies voor: van ${vanStad} naar ${naarStad} op ${datum}. Beste vliegdagen, geschatte prijs, seizoenstips, alternatieve luchthavens.` }],
      }),
    });
    const data = await resp.json();
    const tekst = data.content?.find((c: {type:string}) => c.type==='text')?.text ?? '';
    setAiAdvies(tekst);
    setAiLoading(false);
  }

  async function addReis() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !addForm.bestemming) return;
    const { data } = await sb.from('reizen').insert({
      user_id:user.id, bestemming:addForm.bestemming,
      vertrek_datum:addForm.vertrek_datum||null, terug_datum:addForm.terug_datum||null,
      budget:parseFloat(addForm.budget)||0, status:'Gepland',
    }).select().single();
    if (data) setReizen(prev=>[...prev, data as Reis]);
    setShowAdd(false); setAddForm({ bestemming:'', vertrek_datum:'', terug_datum:'', budget:'' });
  }

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <h1 className="header-box-title">✈️ Reizen</h1>
        <p className="header-box-subtext">Vluchten zoeken, tracker en reisbudget</p>
      </div>

      {/* Vlucht zoeken */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:16 }}>Vlucht zoeken</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, marginBottom:12 }}>
          <input className="input-field" placeholder="Van (bijv. Amsterdam)" value={vanStad} onChange={e=>setVan(e.target.value)}/>
          <input className="input-field" placeholder="Naar (bijv. Yerevan)" value={naarStad} onChange={e=>setNaar(e.target.value)}/>
          <input className="input-field" type="date" value={datum} onChange={e=>setDatum(e.target.value)} style={{ width:160 }}/>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom: aiAdvies ? 16 : 0 }}>
          {naarStad && datum && ([
            { label:'🌍 Google Flights', url: googleFlightsUrl(vanStad, naarStad, datum), kleur:'#0179FE' },
            { label:'🦄 Kiwi.com', url: kiwiUrl(vanStad, naarStad, datum), kleur:'#FF6B6B' },
            { label:'✈️ Cheaptickets', url: cheaptickets(vanStad, naarStad), kleur:'#F59E0B' },
          ]).map(b => (
            <a key={b.label} href={b.url} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:8, textDecoration:'none', color:'white', fontWeight:600, fontSize:13, background:b.kleur }}>
              <ExternalLink size={13}/> {b.label}
            </a>
          ))}
          <button className="btn-ghost" style={{ fontSize:13 }} onClick={haalAiAdvies} disabled={aiLoading || !naarStad}>
            {aiLoading ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : '🤖'} AI Advies
          </button>
        </div>
        {aiAdvies && <div style={{ background:'#EFF6FF', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#1D4ED8', lineHeight:1.6 }}>{aiAdvies}</div>}
      </div>

      {/* Vlucht tracker */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:12 }}>Vlucht tracker</h3>
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <input className="input-field" placeholder="Vluchtnummer (bijv. KL1234)" value={vluchtnr} onChange={e=>setVluchtnr(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&zoekVlucht()} style={{ flex:1 }}/>
          <button className="btn-primary" style={{ fontSize:13 }} onClick={zoekVlucht} disabled={vluchtLoad}>
            {vluchtLoad ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : <Search size={15}/>} Zoek
          </button>
        </div>
        {vluchtErr && <p style={{ fontSize:13, color:'#EF4444' }}>⚠️ {vluchtErr}</p>}
        {vlucht && (
          <div style={{ background:'#F9FAFB', borderRadius:12, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <p style={{ fontSize:16, fontWeight:700 }}>{vlucht.vluchtnummer} <span style={{ fontSize:13, color:'#6B7280' }}>— {vlucht.maatschappij}</span></p>
              <span className="badge" style={{ background:(STATUS_KLEUR[vlucht.status]??'#6B7280')+'20', color:STATUS_KLEUR[vlucht.status]??'#6B7280' }}>{vlucht.status}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:16, alignItems:'center' }}>
              <div>
                <p style={{ fontSize:20, fontWeight:700 }}>{vlucht.vertrek.iata}</p>
                <p style={{ fontSize:12, color:'#6B7280' }}>{vlucht.vertrek.luchthaven}</p>
                <p style={{ fontSize:12, color:'#1A1F36', marginTop:4 }}>{vlucht.vertrek.gepland ? new Date(vlucht.vertrek.gepland).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}) : '—'}</p>
                {vlucht.vertrek.gate && <p style={{ fontSize:11, color:'#9CA3AF' }}>Gate {vlucht.vertrek.gate}</p>}
              </div>
              <Plane size={24} color="#0179FE"/>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:20, fontWeight:700 }}>{vlucht.aankomst.iata}</p>
                <p style={{ fontSize:12, color:'#6B7280' }}>{vlucht.aankomst.luchthaven}</p>
                <p style={{ fontSize:12, color:'#1A1F36', marginTop:4 }}>{(vlucht.aankomst.verwacht||vlucht.aankomst.gepland) ? new Date(vlucht.aankomst.verwacht||vlucht.aankomst.gepland).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}) : '—'}</p>
                {vlucht.aankomst.gate && <p style={{ fontSize:11, color:'#9CA3AF' }}>Gate {vlucht.aankomst.gate}</p>}
              </div>
            </div>
            {vlucht.vertraging > 0 && <p style={{ fontSize:12, color:'#F59E0B', marginTop:8, fontWeight:600 }}>⚠️ Vertraging: {vlucht.vertraging} minuten</p>}
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        {/* Weer bestemming */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:12 }}>Weer op bestemming</h3>
          <div style={{ display:'flex', gap:10, marginBottom:12 }}>
            <input className="input-field" placeholder="Stad (bijv. Yerevan)" value={weerStad} onChange={e=>setWeerStad(e.target.value)} onKeyDown={e=>e.key==='Enter'&&haalWeer()} style={{ flex:1 }}/>
            <button className="btn-primary" style={{ fontSize:13, padding:'0 12px' }} onClick={haalWeer} disabled={weerLoad}>
              {weerLoad ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Cloud size={14}/>}
            </button>
          </div>
          {weer && (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://openweathermap.org/img/wn/${weer.icoon}@2x.png`} alt={weer.beschrijving} style={{ width:64, height:64 }}/>
              <p style={{ fontSize:28, fontWeight:700, color:'#1A1F36' }}>{weer.temp}°C</p>
              <p style={{ fontSize:13, color:'#6B7280', textTransform:'capitalize' }}>{weer.beschrijving}</p>
              <p style={{ fontSize:12, color:'#9CA3AF' }}>{weer.stad}</p>
            </div>
          )}
        </div>

        {/* Mijn reizen */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36' }}>Mijn reizen</h3>
            <button className="btn-primary" style={{ fontSize:12, padding:'6px 10px' }} onClick={()=>setShowAdd(true)}>
              <Plus size={13}/> Nieuw
            </button>
          </div>
          {reizen.length===0 ? (
            <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'16px 0' }}>Nog geen reizen gepland</p>
          ) : reizen.map(r=>(
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F3F4F6' }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600 }}>✈️ {r.bestemming}</p>
                <p style={{ fontSize:11, color:'#9CA3AF' }}>{r.vertrek_datum||'—'} → {r.terug_datum||'—'}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p className="amount" style={{ fontSize:13, color:'#0179FE' }}>{fmtEuro(r.budget)}</p>
                <span className="badge badge-blue" style={{ fontSize:10 }}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add reis modal */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="card" style={{ width:400, padding:28 }}>
            <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, marginBottom:20 }}>Nieuwe reis</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <input className="input-field" placeholder="Bestemming (bijv. Yerevan, Armenië)" value={addForm.bestemming} onChange={e=>setAddForm(f=>({...f,bestemming:e.target.value}))}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input className="input-field" type="date" value={addForm.vertrek_datum} onChange={e=>setAddForm(f=>({...f,vertrek_datum:e.target.value}))}/>
                <input className="input-field" type="date" value={addForm.terug_datum} onChange={e=>setAddForm(f=>({...f,terug_datum:e.target.value}))}/>
              </div>
              <input className="input-field" type="number" placeholder="Budget (€)" value={addForm.budget} onChange={e=>setAddForm(f=>({...f,budget:e.target.value}))}/>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowAdd(false)}>Annuleren</button>
                <button className="btn-primary" style={{ flex:1 }} onClick={addReis}>Opslaan</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
