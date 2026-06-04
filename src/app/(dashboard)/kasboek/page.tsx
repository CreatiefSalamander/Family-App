'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wifi, WifiOff, Delete, Check } from 'lucide-react';

const CATS = ['Boodschappen','Eten','Transport','Auto','Gezondheid','Kleding','Overig'];
const CAT_ICON: Record<string,string> = {
  Boodschappen:'🛒', Eten:'🍔', Transport:'🚇', Auto:'🚗',
  Gezondheid:'💊', Kleding:'👕', Overig:'📄',
};

interface OfflineTx { id:string; bedrag:number; beschrijving:string; categorie:string; datum:string; gesync:boolean; }

const fmtEuro = (n: number) => new Intl.NumberFormat('nl-NL', { style:'currency', currency:'EUR' }).format(n);

export default function KasboekPage() {
  const [invoer,     setInvoer]   = useState('');
  const [categorie,  setCat]      = useState('Boodschappen');
  const [offline,    setOffline]  = useState<OfflineTx[]>([]);
  const [syncing,    setSyncing]  = useState(false);
  const [online,     setOnline]   = useState(true);
  const [success,    setSuccess]  = useState('');
  const sb = createClient();

  useEffect(() => {
    setOnline(navigator.onLine);
    window.addEventListener('online',  () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    const saved = localStorage.getItem('kasboek-offline');
    if (saved) setOffline(JSON.parse(saved));
    return () => {
      window.removeEventListener('online',  () => setOnline(true));
      window.removeEventListener('offline', () => setOnline(false));
    };
  }, []);

  function drukOp(val: string) {
    if (val === '⌫') {
      setInvoer(p => p.slice(0, -1));
    } else if (val === ',') {
      if (!invoer.includes(',')) setInvoer(p => p + ',');
    } else {
      if (invoer.length < 8) setInvoer(p => p + val);
    }
  }

  async function voegToe() {
    const bedrag = parseFloat(invoer.replace(',', '.'));
    if (!bedrag || bedrag <= 0) return;

    const tx: OfflineTx = {
      id:          crypto.randomUUID(),
      bedrag,
      beschrijving: categorie,
      categorie,
      datum:       new Date().toISOString().split('T')[0],
      gesync:      false,
    };

    if (online) {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        await sb.from('transactions').insert({
          user_id: user.id, amount: bedrag, type: 'expense',
          description: categorie, category: categorie,
          date: tx.datum, source: 'Kasboek', status: 'OK',
          is_zakelijk: false, type_soort: 'Uitgave',
        });
        tx.gesync = true;
      }
    }

    const updated = [tx, ...offline];
    setOffline(updated);
    localStorage.setItem('kasboek-offline', JSON.stringify(updated));
    setInvoer('');
    setSuccess(`${fmtEuro(bedrag)} toegevoegd!`);
    setTimeout(() => setSuccess(''), 2000);
  }

  async function syncAlles() {
    const te_synken = offline.filter(t => !t.gesync);
    if (!te_synken.length || !online) return;
    setSyncing(true);

    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSyncing(false); return; }

    for (const tx of te_synken) {
      await sb.from('transactions').insert({
        user_id: user.id, amount: tx.bedrag, type: 'expense',
        description: tx.beschrijving, category: tx.categorie,
        date: tx.datum, source: 'Kasboek', status: 'OK',
        is_zakelijk: false, type_soort: 'Uitgave',
      });
    }

    const synced = offline.map(t => ({ ...t, gesync: true }));
    setOffline(synced);
    localStorage.setItem('kasboek-offline', JSON.stringify(synced));
    setSyncing(false);
  }

  const KEYS = [['7','8','9'],['4','5','6'],['1','2','3'],[',','0','⌫']];
  const ongesync = offline.filter(t => !t.gesync).length;

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h1 className="header-box-title">💵 Kasboek</h1>
            <p className="header-box-subtext">Snel cash uitgaven bijhouden</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {online
              ? <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#22C55E', fontWeight:600 }}><Wifi size={14}/> Online</span>
              : <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#9CA3AF', fontWeight:600 }}><WifiOff size={14}/> Offline</span>
            }
            {ongesync > 0 && (
              <button className="btn-primary" style={{ fontSize:12, padding:'6px 12px' }} onClick={syncAlles} disabled={syncing||!online}>
                {syncing ? 'Syncing...' : `☁️ Sync ${ongesync}`}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:400, margin:'0 auto' }}>
        {/* Bedrag display */}
        <div style={{ textAlign:'center', padding:'24px 0 16px' }}>
          <p style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8 }}>BEDRAG</p>
          <p className="amount" style={{ fontSize:56, color: invoer ? '#1A1F36' : '#E5E7EB', lineHeight:1, minHeight:64 }}>
            {invoer ? `€ ${invoer}` : '€ 0'}
          </p>
          {success && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:20, padding:'4px 14px', marginTop:8 }}>
              <Check size={14} color="#22C55E"/>
              <span style={{ fontSize:13, color:'#16A34A', fontWeight:600 }}>{success}</span>
            </div>
          )}
        </div>

        {/* Categorie chips */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'0 0 16px', WebkitOverflowScrolling:'touch' as const }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              flexShrink:0, padding:'8px 14px', borderRadius:20, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:600, fontFamily:'inherit', transition:'all .15s',
              background: categorie===c ? 'linear-gradient(90deg,#0179FE,#4893FF)' : '#F3F4F6',
              color: categorie===c ? '#fff' : '#4B5563',
            }}>
              {CAT_ICON[c]} {c}
            </button>
          ))}
        </div>

        {/* Numeriek keypad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {KEYS.flat().map(k => (
            <button key={k} onClick={() => drukOp(k)} style={{
              height:64, borderRadius:14, border:'none', cursor:'pointer',
              fontSize: k==='⌫'?22:26, fontWeight: 600, fontFamily:"'JetBrains Mono',monospace",
              background: k==='⌫' ? '#FEF2F2' : '#F9FAFB',
              color: k==='⌫' ? '#EF4444' : '#1A1F36',
              transition:'all .1s',
              boxShadow:'0 2px 4px rgba(0,0,0,.06)',
            }}
              onMouseDown={e => (e.currentTarget.style.transform='scale(.95)')}
              onMouseUp={e => (e.currentTarget.style.transform='scale(1)')}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Toevoegen knop */}
        <button
          className="btn-primary"
          onClick={voegToe}
          disabled={!invoer || invoer === '0'}
          style={{ fontSize:16, padding:'16px', borderRadius:14, marginBottom:28 }}
        >
          {online ? '✅ Toevoegen' : '📵 Opslaan (offline sync later)'}
        </button>

        {/* Recente kasboek transacties */}
        {offline.length > 0 && (
          <div className="card" style={{ padding:16 }}>
            <p style={{ fontSize:13, fontWeight:700, color:'#1A1F36', marginBottom:12 }}>Recent</p>
            {offline.slice(0, 10).map(t => (
              <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #F3F4F6' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18 }}>{CAT_ICON[t.categorie]||'📄'}</span>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{t.beschrijving}</p>
                    <p style={{ fontSize:11, color:'#9CA3AF' }}>{t.datum} {t.gesync ? '☁️' : '📵'}</p>
                  </div>
                </div>
                <p className="amount" style={{ fontSize:14, color:'#EF4444' }}>-{fmtEuro(t.bedrag)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
