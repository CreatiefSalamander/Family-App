'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Store, Coffee, Fuel, Building2, Heart, RefreshCw, Loader2, ExternalLink, Search } from 'lucide-react';

const CATEGORIEEN = [
  { key:'supermarkt',  label:'🛒 Supermarkten', icon:Store },
  { key:'tankstation', label:'⛽ Benzine',       icon:Fuel },
  { key:'restaurant',  label:'🍽️ Restaurants',   icon:Coffee },
  { key:'apotheek',    label:'💊 Apotheek',       icon:Heart },
  { key:'bank',        label:'🏦 Bank/ATM',       icon:Building2 },
];

const VLAGGEN: Record<string, string> = {
  USD:'🇺🇸', GBP:'🇬🇧', TRY:'🇹🇷', AMD:'🇦🇲', AED:'🇦🇪', JPY:'🇯🇵', CHF:'🇨🇭', SEK:'🇸🇪', PLN:'🇵🇱', HUF:'🇭🇺',
};

interface Place { naam:string; adres:string; rating:number|null; open:boolean|null; lat:number; lng:number; }
interface Koers  { [code:string]: number }
interface WeerData { stad:string; temp:number; feelsLike:number; beschrijving:string; icoon:string; luchtvochtigheid:number; windsnelheid:number; forecast:{tijd:string;temp:number;beschrijving:string;icoon:string}[] }

export default function LocatiePage() {
  const [coords,    setCoords]   = useState<{lat:number;lng:number}|null>(null);
  const [geoStatus, setGeoStatus]= useState<'idle'|'loading'|'ok'|'denied'>('idle');
  const [actieve,   setActieve]  = useState('supermarkt');
  const [plaatsen,  setPlaatsen] = useState<Place[]>([]);
  const [plaatsenLoad, setPlaatsenLoad] = useState(false);
  const [weer,      setWeer]     = useState<WeerData|null>(null);
  const [weerLoad,  setWeerLoad] = useState(false);
  const [koersen,   setKoersen]  = useState<Koers>({});
  const [koersenLoad,setKoersenLoad]=useState(false);
  const [weerStad,  setWeerStad] = useState('');
  const [vlucht,    setVlucht]   = useState('');
  const [vluchtData,setVluchtData]=useState<{vluchtnummer:string;status:string;maatschappij:string;vertrek:{luchthaven:string;gepland:string};aankomst:{luchthaven:string;gepland:string};vertraging:number}|null>(null);
  const [vluchtLoad,setVluchtLoad]=useState(false);
  const [vluchtErr, setVluchtErr]= useState('');

  const haalPlaatsen = useCallback(async (lat:number, lng:number, type:string) => {
    setPlaatsenLoad(true);
    const resp = await fetch('/api/google-places', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ lat, lng, type, radius:2000 }) });
    const data = await resp.json();
    setPlaatsen(data.error ? [] : (data.resultaten??[]));
    setPlaatsenLoad(false);
  }, []);

  const haalWeer = useCallback(async (lat:number, lng:number) => {
    setWeerLoad(true);
    const resp = await fetch('/api/weer', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ lat, lng }) });
    const data = await resp.json();
    if (!data.error) setWeer(data);
    setWeerLoad(false);
  }, []);

  const haalKoersen = useCallback(async () => {
    setKoersenLoad(true);
    const resp = await fetch('/api/wisselkoers', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ van:'EUR' }) });
    const data = await resp.json();
    if (!data.error) setKoersen(data.koersen??{});
    setKoersenLoad(false);
  }, []);

  function requestLocation() {
    setGeoStatus('loading');
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const { latitude:lat, longitude:lng } = pos.coords;
        setCoords({ lat, lng }); setGeoStatus('ok');
        haalPlaatsen(lat, lng, actieve);
        haalWeer(lat, lng);
      },
      () => setGeoStatus('denied'),
    );
  }

  useEffect(() => { haalKoersen(); const t = setInterval(haalKoersen, 5*60*1000); return () => clearInterval(t); }, [haalKoersen]);

  useEffect(() => {
    if (coords) haalPlaatsen(coords.lat, coords.lng, actieve);
  }, [actieve, coords, haalPlaatsen]);

  async function zoekVlucht() {
    if (!vlucht.trim()) return;
    setVluchtLoad(true); setVluchtErr(''); setVluchtData(null);
    const resp = await fetch('/api/vlucht-tracker', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ vluchtnummer: vlucht }) });
    const data = await resp.json();
    if (data.error) setVluchtErr(data.error); else setVluchtData(data);
    setVluchtLoad(false);
  }

  async function zoekWeerStad() {
    if (!weerStad.trim()) return;
    setWeerLoad(true);
    const resp = await fetch('/api/weer', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ stad:weerStad }) });
    const data = await resp.json();
    if (!data.error) setWeer(data);
    setWeerLoad(false);
  }

  /* Opent Google Maps navigatie (werkt op mobiel én desktop) */
  function googleMapsUrl(lat:number, lng:number, naam:string) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(naam)}&travelmode=walking`;
  }

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <h1 className="header-box-title">📍 Locatie</h1>
        <p className="header-box-subtext">Winkels in de buurt, wisselkoersen en vluchten</p>
      </div>

      {/* Sectie 1: Weer */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36' }}>🌤️ Weer</h3>
          <div style={{ display:'flex', gap:8 }}>
            <input className="input-field" placeholder="Stad zoeken..." value={weerStad} onChange={e=>setWeerStad(e.target.value)} onKeyDown={e=>e.key==='Enter'&&zoekWeerStad()} style={{ width:180 }}/>
            <button className="btn-ghost" style={{ fontSize:12 }} onClick={zoekWeerStad} disabled={weerLoad}><Search size={14}/></button>
          </div>
        </div>
        {weerLoad ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 0', color:'#6B7280' }}><Loader2 size={18} style={{ animation:'spin 1s linear infinite', color:'#0179FE' }}/><p style={{ fontSize:13 }}>Weer laden...</p></div>
        ) : weer ? (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://openweathermap.org/img/wn/${weer.icoon}@2x.png`} alt={weer.beschrijving} style={{ width:72, height:72 }}/>
              <div>
                <p style={{ fontSize:32, fontWeight:700, color:'#1A1F36', lineHeight:1 }}>{weer.temp}°C</p>
                <p style={{ fontSize:13, color:'#6B7280', textTransform:'capitalize', marginTop:2 }}>{weer.beschrijving} · {weer.stad}</p>
                <p style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>Voelt als {weer.feelsLike}°C · 💧 {weer.luchtvochtigheid}% · 🌬️ {weer.windsnelheid} m/s</p>
              </div>
            </div>
            {weer.forecast?.length > 0 && (
              <div style={{ display:'flex', gap:10, overflowX:'auto', marginTop:16, paddingBottom:4 }}>
                {weer.forecast.map((f,i)=>(
                  <div key={i} style={{ flexShrink:0, textAlign:'center', padding:'8px 12px', background:'#F9FAFB', borderRadius:10, minWidth:72 }}>
                    <p style={{ fontSize:10, color:'#9CA3AF' }}>{new Date(f.tijd).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://openweathermap.org/img/wn/${f.icoon}.png`} alt="" style={{ width:32, height:32 }}/>
                    <p style={{ fontSize:13, fontWeight:700, color:'#1A1F36' }}>{f.temp}°</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ display:'flex', gap:10 }}>
            {geoStatus==='ok' && coords
              ? <button className="btn-ghost" style={{ fontSize:13 }} onClick={()=>haalWeer(coords.lat,coords.lng)}><RefreshCw size={14}/> Huidige locatie</button>
              : <p style={{ fontSize:13, color:'#9CA3AF' }}>Sta locatie toe of zoek op stad</p>
            }
          </div>
        )}
      </div>

      {/* Sectie 2: Winkels in de buurt */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:12 }}>🏪 In de buurt</h3>

        {geoStatus === 'idle' && (
          <div style={{ textAlign:'center', padding:'24px 0' }}>
            <MapPin size={40} color="#0179FE" style={{ margin:'0 auto 12px' }}/>
            <p style={{ fontSize:14, fontWeight:600, color:'#4B5563', marginBottom:4 }}>Locatietoegang nodig</p>
            <button className="btn-primary" style={{ width:'auto', margin:'8px auto 0' }} onClick={requestLocation}>
              <Navigation size={16}/> Locatie toestaan
            </button>
          </div>
        )}

        {geoStatus === 'loading' && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'16px 0', color:'#6B7280' }}>
            <Loader2 size={18} style={{ animation:'spin 1s linear infinite', color:'#0179FE' }}/><p style={{ fontSize:13 }}>Locatie ophalen...</p>
          </div>
        )}

        {geoStatus === 'denied' && (
          <div style={{ background:'#FEF2F2', borderRadius:8, padding:'12px 16px' }}>
            <p style={{ fontSize:13, color:'#DC2626' }}>Locatietoegang geweigerd. Geef toegang via browserinstellingen.</p>
          </div>
        )}

        {geoStatus === 'ok' && (
          <>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
              {CATEGORIEEN.map(c => (
                <button key={c.key} onClick={()=>setActieve(c.key)}
                  style={{ padding:'7px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit', transition:'all .15s', background:actieve===c.key?'linear-gradient(90deg,#0179FE,#4893FF)':'#F3F4F6', color:actieve===c.key?'#fff':'#4B5563' }}>
                  {c.label}
                </button>
              ))}
            </div>

            {plaatsenLoad ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 0', color:'#6B7280' }}>
                <Loader2 size={16} style={{ animation:'spin 1s linear infinite', color:'#0179FE' }}/><p style={{ fontSize:13 }}>Zoeken...</p>
              </div>
            ) : plaatsen.length===0 ? (
              <p style={{ fontSize:13, color:'#9CA3AF', textAlign:'center', padding:'16px 0' }}>Geen resultaten gevonden</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {plaatsen.map((p,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px', background:'#F9FAFB', borderRadius:10 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <MapPin size={18} color="#0179FE"/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.naam}</p>
                      <p style={{ fontSize:11, color:'#9CA3AF' }}>{p.adres}</p>
                      <div style={{ display:'flex', gap:10, marginTop:2 }}>
                        {p.rating && <span style={{ fontSize:11, color:'#F59E0B' }}>⭐ {p.rating}</span>}
                        {p.open!==null && <span style={{ fontSize:11, color:p.open?'#22C55E':'#EF4444', fontWeight:600 }}>{p.open?'Open':'Gesloten'}</span>}
                      </div>
                    </div>
                    <a href={googleMapsUrl(p.lat, p.lng, p.naam)} target="_blank" rel="noopener noreferrer"
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', background:'white', border:'1px solid #E5E7EB', borderRadius:8, textDecoration:'none', color:'#0179FE', fontSize:12, fontWeight:600, flexShrink:0 }}>
                      <Navigation size={12}/> Route
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sectie 3: Wisselkoersen — scrollende ticker */}
      <div className="card" style={{ padding:'16px 0', marginBottom:20, overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px 12px' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36' }}>💱 Live wisselkoersen EUR →</h3>
          <button className="btn-ghost" style={{ fontSize:11, padding:'4px 10px' }} onClick={haalKoersen} disabled={koersenLoad}>
            <RefreshCw size={12} style={{ animation:koersenLoad?'spin 1s linear infinite':'none' }}/>
          </button>
        </div>

        {/* Auto-scrollende ticker */}
        {Object.keys(koersen).length > 0 && (
          <div className="ticker-track" style={{ padding:'4px 0' }}>
            <div className="ticker-content">
              {/* Dubbele inhoud voor naadloze loop */}
              {[...Object.entries(koersen), ...Object.entries(koersen)].map(([code, rate], i) => (
                <a
                  key={i}
                  href={`https://finance.yahoo.com/quote/EUR${code}=X/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ticker-item"
                  data-tip={`1 EUR = ${rate.toFixed(4)} ${code} — klik voor meer details`}
                  style={{ textDecoration:'none', padding:'8px 20px', borderRadius:8, display:'inline-flex', alignItems:'center', gap:8 }}
                >
                  <span style={{ fontSize:18 }}>{VLAGGEN[code]||'💱'}</span>
                  <div>
                    <p style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, lineHeight:1 }}>{code}</p>
                    <p className="amount" style={{ fontSize:14, color:'#1A1F36', lineHeight:1.2 }}>
                      {rate.toFixed(code==='JPY'?2:4)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {koersenLoad && Object.keys(koersen).length===0 && (
          <p style={{ fontSize:13, color:'#9CA3AF', padding:'8px 20px' }}>Koersen laden...</p>
        )}
      </div>

      {/* Sectie 4: Vlucht tracker */}
      <div className="card" style={{ padding:24 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:12 }}>✈️ Vlucht tracker</h3>
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <input className="input-field" placeholder="Vluchtnummer (bijv. KL1234)" value={vlucht} onChange={e=>setVlucht(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&zoekVlucht()} style={{ flex:1 }}/>
          <button className="btn-primary" style={{ fontSize:13 }} onClick={zoekVlucht} disabled={vluchtLoad}>
            {vluchtLoad ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : <Search size={15}/>}
          </button>
        </div>
        {vluchtErr && <p style={{ fontSize:13, color:'#EF4444' }}>⚠️ {vluchtErr}</p>}
        {vluchtData && (
          <div style={{ background:'#F9FAFB', borderRadius:10, padding:14 }}>
            <p style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>{vluchtData.vluchtnummer} · {vluchtData.maatschappij} · <span style={{ color:vluchtData.status==='active'?'#0179FE':vluchtData.status==='landed'?'#22C55E':'#F59E0B' }}>{vluchtData.status}</span></p>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div><p style={{ fontSize:15, fontWeight:700 }}>{vluchtData.vertrek.luchthaven}</p><p style={{ fontSize:12, color:'#6B7280' }}>{vluchtData.vertrek.gepland?new Date(vluchtData.vertrek.gepland).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):''}</p></div>
              <ExternalLink size={18} color="#0179FE" style={{ transform:'rotate(45deg)' }}/>
              <div><p style={{ fontSize:15, fontWeight:700 }}>{vluchtData.aankomst.luchthaven}</p><p style={{ fontSize:12, color:'#6B7280' }}>{vluchtData.aankomst.gepland?new Date(vluchtData.aankomst.gepland).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):''}</p></div>
            </div>
            {vluchtData.vertraging>0 && <p style={{ fontSize:12, color:'#F59E0B', marginTop:8, fontWeight:600 }}>⚠️ {vluchtData.vertraging} min vertraging</p>}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
