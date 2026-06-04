'use client';

import { useState } from 'react';
import { useLang } from '@/lib/lang-context';
import MerchantLogo from '@/components/finance/MerchantLogo';
import { Search, Star, ExternalLink, Bell, TrendingDown, Loader2 } from 'lucide-react';

interface Resultaat {
  titel: string; prijs: string; prijsRaw: number | null;
  winkel: string; link: string; afbeelding: string | null;
  rating: number | null; reviews: number | null;
}

const TRACKERS = [
  { naam:'Albert Heijn Biologisch Melk 1L', prijs:'€1.29', winkel:'Albert Heijn', trend:'↓' },
  { naam:'OV-chipkaart maandabonnement',    prijs:'€99.00', winkel:'NS',          trend:'→' },
  { naam:'Spotify Premium Family',           prijs:'€16.99', winkel:'Spotify',     trend:'↓' },
];

export default function PrijsradarPage() {
  const { t } = useLang();
  const [query,    setQuery]   = useState('');
  const [results,  setResults] = useState<Resultaat[]>([]);
  const [loading,  setLoading] = useState(false);
  const [searched, setSearch]  = useState(false);
  const [error,    setError]   = useState('');

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true); setSearch(true); setError('');
    try {
      const resp = await fetch('/api/zoek-prijs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ product: query }),
      });
      const data = await resp.json();
      if (data.error) { setError(data.error); setResults([]); }
      else setResults(data.resultaten ?? []);
    } catch (e) {
      setError('Verbindingsfout. Probeer opnieuw.');
    }
    setLoading(false);
  }

  /* Goedkoopste resultaat markeren */
  const goedkoopste = results.reduce<number | null>((min, r, i) => {
    if (r.prijsRaw === null) return min;
    return min === null || r.prijsRaw < (results[min]?.prijsRaw ?? Infinity) ? i : min;
  }, null);

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <h1 className="header-box-title">{t.prices.title}</h1>
        <p className="header-box-subtext">{t.prices.subtitle}</p>
      </div>

      {/* Zoekbalk */}
      <div className="card" style={{ padding:24, marginBottom:24 }}>
        <div style={{ display:'flex', gap:12 }}>
          <div style={{ position:'relative', flex:1 }}>
            <Search size={18} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
            <input
              className="input-field"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder={t.prices.search_placeholder}
              style={{ paddingLeft:44, fontSize:15, padding:'14px 14px 14px 44px' }}
            />
          </div>
          <button className="btn-primary" onClick={doSearch} disabled={loading}
            style={{ fontSize:14, padding:'0 24px', flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
            {loading ? <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> : <Search size={16}/>}
            {t.prices.search_btn}
          </button>
        </div>

        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:12 }}>
          {['Melk','Wasmiddel','Telefoon oplader','Koffie','Olijfolie'].map(s => (
            <button key={s} onClick={() => { setQuery(s); }}
              style={{ fontSize:12, padding:'5px 10px', background:'#F3F4F6', border:'none', borderRadius:20, cursor:'pointer', color:'#6B7280', fontFamily:'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.background='#EFF6FF')}
              onMouseLeave={e => (e.currentTarget.style.background='#F3F4F6')}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Fout */}
      {error && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
          <p style={{ fontSize:13, color:'#DC2626' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Laden */}
      {loading && (
        <div className="card" style={{ padding:32, textAlign:'center', marginBottom:24 }}>
          <Loader2 size={32} color="#0179FE" style={{ animation:'spin 1s linear infinite', margin:'0 auto 12px' }}/>
          <p style={{ color:'#6B7280', fontSize:14 }}>Zoeken via Google Shopping...</p>
        </div>
      )}

      {/* Resultaten */}
      {!loading && searched && results.length > 0 && (
        <div className="card" style={{ overflow:'hidden', marginBottom:24 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontSize:14, fontWeight:700, color:'#1A1F36' }}>
              {results.length} resultaten voor &quot;{query}&quot;
            </p>
            <span className="badge badge-blue">{results.length} gevonden</span>
          </div>

          {results.map((r, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:14, padding:'14px 20px',
              borderBottom:'1px solid #F9FAFB', transition:'background .1s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background='#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.background='transparent')}>

              {/* Afbeelding of logo */}
              <div style={{ width:48, height:48, borderRadius:10, overflow:'hidden', flexShrink:0, background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {r.afbeelding ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={r.afbeelding} alt={r.titel} style={{ width:48, height:48, objectFit:'cover' }}
                    onError={e => (e.currentTarget.style.display='none')}/>
                ) : (
                  <MerchantLogo naam={r.winkel} size={40}/>
                )}
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.titel}
                  </p>
                  {i === goedkoopste && (
                    <span className="badge badge-green" style={{ flexShrink:0 }}>🏆 Beste koop</span>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <MerchantLogo naam={r.winkel} size={16}/>
                  <p style={{ fontSize:12, color:'#6B7280' }}>{r.winkel}</p>
                  {r.rating && (
                    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                      <Star size={11} color="#F59E0B" fill="#F59E0B"/>
                      <span style={{ fontSize:11, color:'#6B7280' }}>{r.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Prijs */}
              <p className="amount" style={{ fontSize:18, color:'#1A1F36', flexShrink:0, minWidth:70, textAlign:'right' }}>
                {r.prijs}
              </p>

              {/* Acties */}
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <a href={r.link} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', background:'#EFF6FF', border:'none', borderRadius:8, cursor:'pointer', textDecoration:'none', color:'#0179FE', fontSize:12, fontWeight:600 }}>
                  <ExternalLink size={13}/> Bekijk
                </a>
                <button style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', background:'#F3F4F6', border:'none', borderRadius:8, cursor:'pointer', color:'#6B7280', fontSize:12, fontFamily:'inherit' }}>
                  <Bell size={13}/> Volg
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Geen resultaten */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="card" style={{ padding:48, textAlign:'center', marginBottom:24 }}>
          <p style={{ fontSize:36, marginBottom:8 }}>🔍</p>
          <p style={{ fontWeight:600, color:'#4B5563' }}>Geen resultaten gevonden voor &quot;{query}&quot;</p>
          <p style={{ fontSize:13, color:'#9CA3AF', marginTop:4 }}>Probeer een andere zoekterm</p>
        </div>
      )}

      {/* Actieve trackers */}
      <div>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:12 }}>
          {t.prices.trackers}
        </h3>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {TRACKERS.map((tr, i) => (
            <div key={i} className="card card-hover" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <TrendingDown size={20} color="#22C55E"/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{tr.naam}</p>
                <p style={{ fontSize:11, color:'#9CA3AF' }}>{tr.winkel}</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <p className="amount" style={{ fontSize:15, color:'#1A1F36' }}>{tr.prijs}</p>
                <span style={{ fontSize:14, color: tr.trend==='↓'?'#22C55E':'#9CA3AF' }}>{tr.trend}</span>
                <span className="badge badge-green">Actief</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
