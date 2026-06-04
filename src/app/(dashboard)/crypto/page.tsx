'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ExternalLink, TrendingUp, TrendingDown, Bitcoin } from 'lucide-react';
import DoughnutChart from '@/components/ui/DoughnutChart';
import type { Rekening } from '@/types';

const fmtEuro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

interface Coin { symbol: string; naam: string; hoeveelheid: number; prijs: number; waarde: number; }

const COIN_KLEUREN: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', BNB: '#F0B90B', SOL: '#9945FF',
  ADA: '#0033AD', DOT: '#E6007A', XRP: '#346AA9', DOGE: '#C3A634',
  MATIC: '#8247E5', LINK: '#2A5ADA', USDT: '#26A17B', USDC: '#2775CA',
};

export default function CryptoPage() {
  const [coins,   setCoins]   = useState<Coin[]>([]);
  const [totaal,  setTotaal]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const resp = await fetch('/api/bitvavo');
      const data = await resp.json();
      if (data.error) { setError(data.error); }
      else {
        setCoins(data.coins ?? []);
        setTotaal(data.totaal ?? 0);
        setLastUpdate(new Date());
      }
    } catch { setError('Kon Bitvavo niet bereiken.'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  /* Pseudo-rekeningen voor donut chart */
  const rekeningen: Rekening[] = coins
    .filter(c => c.waarde > 0.01 && c.symbol !== 'EUR')
    .slice(0, 5)
    .map(c => ({ id: c.symbol, user_id: '', name: c.symbol, bank_name: 'Bitvavo', balance: c.waarde, color_gradient: 'blue', account_number_masked: '' }));

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h1 className="header-box-title">Crypto Portfolio</h1>
            <p className="header-box-subtext">Jouw Bitvavo portfolio in real-time</p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {lastUpdate && <p style={{ fontSize:11, color:'#9CA3AF' }}>Bijgewerkt: {lastUpdate.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}</p>}
            <button className="btn-ghost" style={{ fontSize:13 }} onClick={load} disabled={loading}>
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Ververs
            </button>
            <a href="https://app.bitvavo.com" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:13, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
              <ExternalLink size={14}/> Bitvavo
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'12px 16px', marginBottom:20 }}>
          <p style={{ fontSize:13, color:'#92400E', fontWeight:600 }}>⚠️ {error}</p>
          <p style={{ fontSize:12, color:'#78350F', marginTop:4 }}>Controleer of je Bitvavo API keys correct zijn ingesteld in Netlify (BITVAVO_API_KEY + BITVAVO_API_SECRET).</p>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding:48, textAlign:'center' }}>
          <Bitcoin size={48} color="#F7931A" style={{ margin:'0 auto 16px', animation:'pulse 1.5s infinite' }}/>
          <p style={{ color:'#6B7280', fontSize:14 }}>Portfolio laden van Bitvavo...</p>
        </div>
      ) : !error && (
        <>
          {/* Totaal waarde */}
          <div className="total-balance fade-up" style={{ background:'linear-gradient(135deg,#1A1F36,#374151)', marginBottom:24 }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>
                Totale portfolio waarde
              </p>
              <p className="amount" style={{ fontSize:34, color:'#fff' }}>{fmtEuro(totaal)}</p>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:4 }}>{coins.filter(c=>c.symbol!=='EUR').length} coins</p>
            </div>
            {rekeningen.length > 0 && (
              <div style={{ width:100, flexShrink:0 }}>
                <DoughnutChart rekeningen={rekeningen}/>
              </div>
            )}
          </div>

          {/* Coin cards */}
          {coins.length === 0 ? (
            <div className="card" style={{ padding:48, textAlign:'center' }}>
              <p style={{ fontSize:36, marginBottom:8 }}>₿</p>
              <p style={{ fontWeight:600, color:'#4B5563' }}>Geen coins gevonden</p>
              <p style={{ fontSize:13, color:'#9CA3AF', marginTop:4 }}>Voeg coins toe op Bitvavo om je portfolio te zien</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
              {coins.map(c => {
                const kleur = COIN_KLEUREN[c.symbol] ?? '#6B7280';
                return (
                  <div key={c.symbol} className="card card-hover" style={{ padding:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:kleur+'20', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <p style={{ fontSize:16, fontWeight:700, color:kleur }}>{c.symbol.slice(0,3)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:15, fontWeight:700, color:'#1A1F36' }}>{c.symbol}</p>
                        <p style={{ fontSize:11, color:'#9CA3AF' }}>{c.hoeveelheid.toFixed(8).replace(/0+$/,'').replace(/\.$/,'')}</p>
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                      <div>
                        <p style={{ fontSize:11, color:'#6B7280', marginBottom:2 }}>Huidige prijs</p>
                        <p className="amount" style={{ fontSize:14, color:'#1A1F36' }}>{c.symbol==='EUR'?'€1,00':fmtEuro(c.prijs)}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:11, color:'#6B7280', marginBottom:2 }}>Waarde</p>
                        <p className="amount" style={{ fontSize:18, color:kleur }}>{fmtEuro(c.waarde)}</p>
                      </div>
                    </div>
                    {totaal > 0 && (
                      <div className="progress-track" style={{ marginTop:12 }}>
                        <div className="progress-fill" style={{ width:Math.min(100,(c.waarde/totaal)*100)+'%', background:kleur }}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
