'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { detecteerBank, parseRabobankCSV, parseINGCSV } from '@/lib/bank/csv-parser';
import type { RuweTransactie } from '@/lib/bank/csv-parser';
import { Upload, FileText, FileSpreadsheet, File, Check, X, AlertCircle, ChevronRight } from 'lucide-react';

const fmtEuro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

type ImportResultaat = { nieuw: number; dubbel: number; intern: number; fouten: number };
type TabType = 'csv' | 'excel' | 'pdf';

interface TxPreview {
  datum: string; omschrijving: string; tegenpartij: string;
  bedrag: number; categorie: string; selected: boolean;
}

/* ── Categorie detectie ─────────────────────────────────── */
const CATMAP: [string, string][] = [
  ['albert heijn','Boodschappen'],['jumbo','Boodschappen'],['lidl','Boodschappen'],['aldi','Boodschappen'],
  ['shell','Auto'],['bp ','Auto'],['esso','Auto'],['tango','Auto'],
  ['ns ','Transport'],['ov-chip','Transport'],
  ['spotify','Lifestyle'],['netflix','Lifestyle'],['disney','Lifestyle'],
  ['apotheek','Gezondheid'],['etos','Gezondheid'],['kruidvat','Gezondheid'],
  ['zorgverzekering','Zorgverzekering'],['cz ','Zorgverzekering'],['vgz','Zorgverzekering'],
  ['huur','Wonen'],['hypotheek','Wonen'],
  ['eneco','Energie'],['vattenfall','Energie'],['essent','Energie'],
  ['belastingdienst','Belasting'],['duo ','Schulden'],['avres','Schulden'],
  ['salaris','Inkomen'],['uwv','Inkomen'],
  ['kpn','Telefoon'],['vodafone','Telefoon'],['t-mobile','Telefoon'],['ziggo','Telefoon'],
];

function detecteerCategorie(omschrijving: string, tegenpartij: string): string {
  const text = (omschrijving + ' ' + tegenpartij).toLowerCase();
  for (const [kw, cat] of CATMAP) {
    if (text.includes(kw)) return cat;
  }
  return 'Overig';
}

export default function ImportPage() {
  const [tab, setTab]           = useState<TabType>('csv');
  const [txPreview, setPreview] = useState<TxPreview[]>([]);
  const [importing, setImport]  = useState(false);
  const [resultaat, setResult]  = useState<ImportResultaat | null>(null);
  const [error, setError]       = useState('');
  const [bestandNaam, setNaam]  = useState('');
  const [progress, setProgress] = useState(0);
  const dropRef = useRef<HTMLDivElement>(null);
  const sb = createClient();

  /* ─── CSV verwerken ─────────────────────────────────── */
  function verwerkCSV(inhoud: string, naam: string) {
    setNaam(naam); setError(''); setResult(null);
    try {
      const headers = inhoud.split('\n')[0].split(';').concat(inhoud.split('\n')[0].split(','));
      const bank    = detecteerBank(headers);
      const ruwe: RuweTransactie[] = bank === 'Rabobank' ? parseRabobankCSV(inhoud) : parseINGCSV(inhoud);
      const preview: TxPreview[] = ruwe.slice(0, 100).map(r => ({
        datum:       r.datum,
        omschrijving: r.omschrijving || r.tegenpartij,
        tegenpartij: r.tegenpartij,
        bedrag:      r.bedrag,
        categorie:   detecteerCategorie(r.omschrijving, r.tegenpartij),
        selected:    true,
      }));
      setPreview(preview);
    } catch (e) {
      setError('Kon het CSV bestand niet lezen. Controleer het formaat (Rabobank of ING).');
    }
  }

  /* ─── Excel verwerken ───────────────────────────────── */
  async function verwerkExcel(buffer: ArrayBuffer, naam: string) {
    setNaam(naam); setError(''); setResult(null);
    try {
      const XLSX = await import('xlsx');
      const wb   = XLSX.read(buffer, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const preview: TxPreview[] = rows.slice(0, 100).map(r => ({
        datum:        String(r['Datum'] || r['datum'] || ''),
        omschrijving: String(r['Omschrijving'] || r['omschrijving'] || r['Beschrijving'] || ''),
        tegenpartij:  String(r['Tegenpartij'] || r['tegenpartij'] || ''),
        bedrag:       parseFloat(String(r['Bedrag'] || r['bedrag'] || '0').replace(',', '.')),
        categorie:    String(r['Categorie'] || r['categorie'] || detecteerCategorie(String(r['Omschrijving']||''), String(r['Tegenpartij']||''))),
        selected:     true,
      })).filter(r => r.bedrag !== 0);
      setPreview(preview);
    } catch (e) {
      setError('Kon het Excel bestand niet lezen. Zorg voor kolommen: Datum, Omschrijving, Bedrag.');
    }
  }

  /* ─── PDF/Word verwerken via server-side API route ──── */
  async function verwerkDocument(bestand: File) {
    setNaam(bestand.name); setError(''); setResult(null); setPreview([]);
    try {
      let body: Record<string, unknown>;

      if (bestand.name.endsWith('.docx')) {
        /* Word: extraheer tekst client-side, stuur tekst naar server */
        const mammoth = await import('mammoth');
        const buffer  = await bestand.arrayBuffer();
        const result  = await mammoth.extractRawText({ arrayBuffer: buffer });
        body = { tekst: result.value };
      } else if (bestand.name.endsWith('.pdf')) {
        /* PDF: stuur base64 naar server-side analyze-document route */
        const buffer = await bestand.arrayBuffer();
        const b64    = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        body = { base64: b64, mediaType: 'application/pdf' };
      } else {
        setError('Niet ondersteund bestandstype voor AI analyse.');
        return;
      }

      const resp = await fetch('/api/analyze-document', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await resp.json();

      if (data.error) {
        setError('Claude kon het document niet lezen: ' + data.error);
        return;
      }

      const parsed = (data.transacties ?? []) as Array<{datum:string; omschrijving:string; bedrag:number; categorie?:string}>;
      setPreview(parsed.slice(0, 100).map(p => ({
        datum:        p.datum,
        omschrijving: p.omschrijving,
        tegenpartij:  '',
        bedrag:       p.bedrag,
        categorie:    p.categorie || detecteerCategorie(p.omschrijving, ''),
        selected:     true,
      })));
    } catch (e) {
      setError('Fout bij verwerken: ' + (e instanceof Error ? e.message : 'Onbekende fout'));
    }
  }

  /* ─── Bestand verwerken ─────────────────────────────── */
  async function verwerkBestand(bestand: File) {
    const ext = bestand.name.toLowerCase();
    if (ext.endsWith('.csv')) {
      const tekst = await bestand.text();
      verwerkCSV(tekst, bestand.name);
    } else if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
      const buf = await bestand.arrayBuffer();
      verwerkExcel(buf, bestand.name);
    } else if (ext.endsWith('.pdf') || ext.endsWith('.docx')) {
      setTab('pdf');
      await verwerkDocument(bestand);
    } else {
      setError('Niet ondersteund bestandstype. Gebruik .csv, .xlsx, .pdf of .docx');
    }
  }

  /* ─── Importeer naar Supabase ───────────────────────── */
  async function importeer() {
    setImport(true); setProgress(0); setResult(null);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setImport(false); return; }

    const geselecteerd = txPreview.filter(t => t.selected);
    let nieuw = 0, dubbel = 0, fouten = 0;
    const BATCH = 10;

    for (let i = 0; i < geselecteerd.length; i += BATCH) {
      const batch = geselecteerd.slice(i, i + BATCH);
      for (const tx of batch) {
        try {
          const { error } = await sb.from('transactions').insert({
            user_id:     user.id,
            amount:      Math.abs(tx.bedrag),
            type:        tx.bedrag >= 0 ? 'income' : 'expense',
            description: tx.omschrijving,
            category:    tx.categorie,
            date:        tx.datum || new Date().toISOString().split('T')[0],
            source:      'Import',
            status:      'OK',
            is_zakelijk: false,
            type_soort:  tx.bedrag >= 0 ? 'Inkomst' : 'Uitgave',
          });
          if (error) {
            if (error.code === '23505') dubbel++;
            else fouten++;
          } else {
            nieuw++;
          }
        } catch { fouten++; }
      }
      setProgress(Math.round(((i + BATCH) / geselecteerd.length) * 100));
    }

    setResult({ nieuw, dubbel, intern: 0, fouten });
    setPreview([]);
    setImport(false);
    setProgress(100);
  }

  /* ─── Drop handlers ─────────────────────────────────── */
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const bestand = e.dataTransfer.files[0];
    if (bestand) verwerkBestand(bestand);
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const bestand = e.target.files?.[0];
    if (bestand) verwerkBestand(bestand);
    e.target.value = '';
  }

  const TABS: { id: TabType; label: string; icon: typeof File; accept: string }[] = [
    { id: 'csv',   label: 'CSV (Rabobank/ING)', icon: FileText,        accept: '.csv' },
    { id: 'excel', label: 'Excel (.xlsx)',       icon: FileSpreadsheet, accept: '.xlsx,.xls' },
    { id: 'pdf',   label: 'PDF / Word',          icon: File,            accept: '.pdf,.docx' },
  ];

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <h1 className="header-box-title">Importeer transacties</h1>
        <p className="header-box-subtext">Importeer je bankafschriften automatisch — CSV, Excel, PDF of Word</p>
      </div>

      {/* Tab kiezer */}
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => { setTab(tb.id); setPreview([]); setError(''); setResult(null); }}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'10px 16px',
              borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
              fontFamily:'inherit', transition:'all .15s',
              background: tab===tb.id ? 'linear-gradient(135deg,#0179FE,#4893FF)' : '#F3F4F6',
              color: tab===tb.id ? '#fff' : '#4B5563',
            }}>
            <tb.icon size={16}/> {tb.label}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onDragEnter={() => dropRef.current && (dropRef.current.style.borderColor = '#0179FE')}
        onDragLeave={() => dropRef.current && (dropRef.current.style.borderColor = '#E5E7EB')}
        style={{
          border: '2px dashed #E5E7EB',
          borderRadius: 16, padding: 40,
          textAlign: 'center', cursor: 'pointer',
          marginBottom: 20, transition: 'border-color .2s',
          background: '#FAFAFA',
        }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input id="file-input" type="file" accept={activeTab.accept} onChange={onFileInput} style={{ display:'none' }} />
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <Upload size={28} color="#0179FE"/>
        </div>
        <p style={{ fontSize:16, fontWeight:700, color:'#1A1F36', marginBottom:6 }}>
          Sleep hier je {activeTab.label} bestand
        </p>
        <p style={{ fontSize:13, color:'#9CA3AF' }}>
          of klik om te bladeren
        </p>
        {bestandNaam && (
          <p style={{ fontSize:12, color:'#0179FE', marginTop:10, fontWeight:600 }}>
            📄 {bestandNaam}
          </p>
        )}
      </div>

      {/* Info per tab */}
      {tab === 'csv' && (
        <div className="card" style={{ padding:16, marginBottom:16, background:'#EFF6FF', border:'none' }}>
          <p style={{ fontSize:13, fontWeight:600, color:'#0179FE', marginBottom:6 }}>💡 Hoe download je een CSV?</p>
          <p style={{ fontSize:12, color:'#3B82F6' }}>
            <strong>Rabobank:</strong> Internetbankieren → Betaalrekening → Exporteer als CSV<br/>
            <strong>ING:</strong> Mijn ING → Betaalrekening → Transacties downloaden → Kommagescheiden
          </p>
        </div>
      )}
      {tab === 'excel' && (
        <div className="card" style={{ padding:16, marginBottom:16, background:'#EFF6FF', border:'none' }}>
          <p style={{ fontSize:13, fontWeight:600, color:'#0179FE', marginBottom:6 }}>📊 Excel formaat</p>
          <p style={{ fontSize:12, color:'#3B82F6' }}>
            Vereiste kolommen: <strong>Datum</strong>, <strong>Omschrijving</strong>, <strong>Bedrag</strong><br/>
            Optioneel: Tegenpartij, Categorie, IBAN
          </p>
        </div>
      )}
      {tab === 'pdf' && (
        <div className="card" style={{ padding:16, marginBottom:16, background:'#EFF6FF', border:'none' }}>
          <p style={{ fontSize:13, fontWeight:600, color:'#0179FE', marginBottom:6 }}>🤖 AI-gestuurde extractie</p>
          <p style={{ fontSize:12, color:'#3B82F6' }}>
            Claude AI leest je PDF of Word document en extraheert automatisch alle transacties.<br/>
            Vereist: Claude API key ingesteld via <strong>Instellingen → Claude AI</strong>
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <AlertCircle size={18} color="#EF4444"/>
          <p style={{ fontSize:13, color:'#DC2626', fontWeight:500 }}>{error}</p>
        </div>
      )}

      {/* Resultaat */}
      {resultaat && (
        <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:12, padding:20, marginBottom:20 }}>
          <p style={{ fontSize:15, fontWeight:700, color:'#16A34A', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <Check size={20}/> Import voltooid!
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { label:'Nieuw geïmporteerd', value:resultaat.nieuw,  color:'#22C55E' },
              { label:'Al aanwezig',        value:resultaat.dubbel, color:'#F59E0B' },
              { label:'Fouten',             value:resultaat.fouten, color:'#EF4444' },
            ].map(r => (
              <div key={r.label} className="card" style={{ padding:12, textAlign:'center' }}>
                <p style={{ fontSize:22, fontWeight:700, color:r.color }}>{r.value}</p>
                <p style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview tabel */}
      {txPreview.length > 0 && (
        <div className="card" style={{ overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:'#1A1F36' }}>
                Preview — {txPreview.filter(t=>t.selected).length} van {txPreview.length} geselecteerd
              </p>
              <p style={{ fontSize:12, color:'#9CA3AF' }}>Klik op een rij om te de-selecteren</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setPreview(p => p.map(t => ({...t, selected:true})))} className="btn-ghost" style={{ fontSize:12, padding:'6px 12px' }}>
                Alles selecteren
              </button>
              <button onClick={importeer} disabled={importing || txPreview.filter(t=>t.selected).length===0}
                className="btn-primary" style={{ fontSize:13, padding:'8px 20px' }}>
                {importing ? `Importeren... ${progress}%` : `Importeer ${txPreview.filter(t=>t.selected).length} transacties`}
              </button>
            </div>
          </div>

          {/* Progress balk */}
          {importing && (
            <div style={{ padding:'0 20px 8px' }}>
              <div className="progress-track" style={{ marginTop:8 }}>
                <div className="progress-fill" style={{ width:progress+'%', background:'#0179FE', transition:'width .3s' }}/>
              </div>
            </div>
          )}

          {/* Tabel header */}
          <div style={{ display:'grid', gridTemplateColumns:'32px 90px 1fr 100px 70px 90px', gap:10, padding:'8px 20px', background:'#F9FAFB', borderBottom:'1px solid #F3F4F6' }}>
            {['','Datum','Omschrijving','Categorie','Bedrag',''].map((h,i) => (
              <p key={i} style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</p>
            ))}
          </div>

          {txPreview.slice(0, 50).map((tx, i) => (
            <div key={i}
              onClick={() => setPreview(p => p.map((t,j) => j===i ? {...t,selected:!t.selected} : t))}
              style={{
                display:'grid', gridTemplateColumns:'32px 90px 1fr 100px 70px 90px',
                gap:10, padding:'10px 20px', borderBottom:'1px solid #F9FAFB',
                alignItems:'center', cursor:'pointer',
                opacity: tx.selected ? 1 : 0.4,
                background: tx.selected ? 'transparent' : '#F9FAFB',
                transition:'all .1s',
              }}>
              <div style={{ width:20, height:20, borderRadius:5, border:'2px solid', borderColor:tx.selected?'#0179FE':'#D1D5DB', background:tx.selected?'#0179FE':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {tx.selected && <Check size={12} color="white"/>}
              </div>
              <p style={{ fontSize:11, color:'#6B7280' }}>{tx.datum}</p>
              <p style={{ fontSize:12, fontWeight:500, color:'#1A1F36', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.omschrijving}</p>
              <span className={`badge ${tx.bedrag>=0?'badge-green':'badge-gray'}`} style={{ fontSize:10, alignSelf:'center' }}>{tx.categorie}</span>
              <p className="amount" style={{ fontSize:12, color:tx.bedrag>=0?'#22C55E':'#EF4444' }}>
                {tx.bedrag>=0?'+':''}{fmtEuro(tx.bedrag)}
              </p>
              <button onClick={e => { e.stopPropagation(); setPreview(p => p.filter((_,j) => j!==i)); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:4 }}>
                <X size={14}/>
              </button>
            </div>
          ))}

          {txPreview.length > 50 && (
            <p style={{ textAlign:'center', padding:'12px 20px', fontSize:12, color:'#9CA3AF' }}>
              ... en nog {txPreview.length - 50} meer
            </p>
          )}
        </div>
      )}
    </div>
  );
}
