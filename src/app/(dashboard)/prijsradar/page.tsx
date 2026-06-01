'use client';

import { useState } from 'react';
import { useLang } from '@/lib/lang-context';
import { Search, Star, ExternalLink, TrendingDown } from 'lucide-react';

interface Result { naam: string; prijs: string; winkel: string; link: string; rating: number; }

const TRACKERS = [
  { naam:'Albert Heijn Biologisch Melk 1L', prijs:'€1.29', laag:'€1.09', winkel:'Albert Heijn' },
  { naam:'OV-chipkaart maandabonnement Amsterdam', prijs:'€99.00', laag:'€89.00', winkel:'NS' },
  { naam:'Spotify Premium Family', prijs:'€16.99', laag:'€14.99', winkel:'Spotify' },
];

export default function PrijsradarPage() {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  function doSearch() {
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    // Simuleer resultaten
    setTimeout(() => {
      setResults([
        { naam: query + ' — Albert Heijn',  prijs: '€'+((Math.random()*20)+1).toFixed(2), winkel: 'Albert Heijn', link: '#', rating: 4.2 },
        { naam: query + ' — Jumbo',         prijs: '€'+((Math.random()*20)+1).toFixed(2), winkel: 'Jumbo', link: '#', rating: 4.0 },
        { naam: query + ' — Lidl',          prijs: '€'+((Math.random()*20)+1).toFixed(2), winkel: 'Lidl', link: '#', rating: 3.8 },
        { naam: query + ' — Bol.com',       prijs: '€'+((Math.random()*20)+1).toFixed(2), winkel: 'Bol.com', link: '#', rating: 4.5 },
        { naam: query + ' — Amazon',        prijs: '€'+((Math.random()*20)+1).toFixed(2), winkel: 'Amazon', link: '#', rating: 4.3 },
      ]);
      setLoading(false);
    }, 800);
  }

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
            <input className="input-field" value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&doSearch()}
              placeholder={t.prices.search_placeholder} style={{ paddingLeft:44, fontSize:15, padding:'14px 14px 14px 44px' }}/>
          </div>
          <button className="btn-primary" onClick={doSearch} style={{ fontSize:14, padding:'0 24px', flexShrink:0 }}>
            <Search size={16}/> {t.prices.search_btn}
          </button>
        </div>
      </div>

      {/* Resultaten */}
      {loading ? (
        <div className="card" style={{ padding:24 }}>
          {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{ height:64, marginBottom:10, borderRadius:10 }}/>)}
        </div>
      ) : searched && results.length>0 ? (
        <div className="card" style={{ overflow:'hidden', marginBottom:24 }}>
          <div style={{ padding:'12px 20px', borderBottom:'1px solid #F3F4F6', background:'#F9FAFB' }}>
            <p style={{ fontSize:13, fontWeight:600, color:'#6B7280' }}>{results.length} resultaten voor &quot;{query}&quot;</p>
          </div>
          {results.map((r,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 20px', borderBottom:'1px solid #F9FAFB' }}
              onMouseEnter={e=>(e.currentTarget.style.background='#F9FAFB')}
              onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                🏪
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.naam}</p>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                  <span style={{ fontSize:11, color:'#6B7280' }}>{r.winkel}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                    <Star size={11} color="#F59E0B" fill="#F59E0B"/>
                    <span style={{ fontSize:11, color:'#6B7280' }}>{r.rating}</span>
                  </div>
                </div>
              </div>
              <p className="amount" style={{ fontSize:16, color:'#1A1F36', flexShrink:0 }}>{r.prijs}</p>
              <a href={r.link} style={{ color:'#0179FE', display:'flex', alignItems:'center' }}><ExternalLink size={15}/></a>
            </div>
          ))}
        </div>
      ) : null}

      {/* Actieve trackers */}
      <div>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1F36', marginBottom:12 }}>{t.prices.trackers}</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {TRACKERS.map((tr,i)=>(
            <div key={i} className="card card-hover" style={{ padding:16, display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <TrendingDown size={20} color="#22C55E"/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{tr.naam}</p>
                <p style={{ fontSize:11, color:'#9CA3AF' }}>{tr.winkel} · Laagste: {tr.laag}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p className="amount" style={{ fontSize:15, color:'#1A1F36' }}>{tr.prijs}</p>
                <span className="badge badge-green" style={{ marginTop:2 }}>Tracken</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
