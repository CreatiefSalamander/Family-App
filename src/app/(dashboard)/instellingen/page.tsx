'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { LANG_LABELS, type Lang } from '@/lib/translations';
import { User, Globe, Bot, Database, Tag, CheckCircle, Bell } from 'lucide-react';
import PushButton from '@/components/ui/PushButton';

type Tab = 'profiel' | 'taal' | 'ai' | 'supabase' | 'regels' | 'notificaties';

export default function InstellingenPage() {
  const { t, lang } = useLang();
  const [tab, setTab]       = useState<Tab>('profiel');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [form, setForm]     = useState({ voornaam:'', achternaam:'', email:'' });
  const [apiKey, setApiKey] = useState('');
  const [selectedLang, setSelectedLang] = useState<Lang>(lang);
  const sb = createClient();

  useEffect(()=>{
    (async()=>{
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      setForm(f=>({...f, email:user.email||''}));
      const { data:p } = await sb.from('profielen').select('*').eq('id',user.id).single();
      if (p) { setForm(f=>({...f, voornaam:p.voornaam||'', achternaam:p.achternaam||''})); setSelectedLang((p.taal||'nl') as Lang); }
      const k = localStorage.getItem('claude_api_key');
      if (k) setApiKey(k);
    })();
  },[]);

  async function saveProfiel() {
    setSaving(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from('profielen').upsert({ id:user.id, voornaam:form.voornaam, achternaam:form.achternaam });
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  }

  async function saveLang() {
    setSaving(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from('profielen').upsert({ id:user.id, taal:selectedLang });
    setSaving(false); setSaved(true);
    setTimeout(()=>{ setSaved(false); window.location.reload(); }, 1000);
  }

  function saveApiKey() {
    localStorage.setItem('claude_api_key', apiKey);
    setSaved(true); setTimeout(()=>setSaved(false), 2500);
  }

  const TABS: { id:Tab; icon:typeof User; label:string }[] = [
    { id:'profiel',       icon:User,     label:t.settings.profile },
    { id:'taal',          icon:Globe,    label:t.settings.language },
    { id:'notificaties',  icon:Bell,     label:'Notificaties' },
    { id:'ai',            icon:Bot,      label:t.settings.ai },
    { id:'supabase',      icon:Database, label:t.settings.supabase },
    { id:'regels',        icon:Tag,      label:t.settings.rules },
  ];

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <h1 className="header-box-title">{t.settings.title}</h1>
        <p className="header-box-subtext">{t.settings.subtitle}</p>
      </div>

      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
        {/* Zijnavigatie */}
        <div className="card" style={{ padding:8, width:200, flexShrink:0 }}>
          {TABS.map(tb=>(
            <button key={tb.id} onClick={()=>setTab(tb.id)} style={{
              display:'flex', alignItems:'center', gap:10, width:'100%',
              padding:'10px 14px', borderRadius:8, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:500, fontFamily:'inherit', transition:'background .15s',
              background:tab===tb.id?'#EFF6FF':'transparent',
              color:tab===tb.id?'#0179FE':'#4B5563',
            }}>
              <tb.icon size={16}/> {tb.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card" style={{ flex:1, padding:28 }}>

          {/* Succes banner */}
          {saved && (
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:10, padding:'10px 16px', marginBottom:20 }}>
              <CheckCircle size={18} color="#22C55E"/>
              <p style={{ fontSize:13, fontWeight:600, color:'#16A34A' }}>{t.settings.saved}</p>
            </div>
          )}

          {/* PROFIEL TAB */}
          {tab==='profiel' && (
            <div>
              <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, color:'#1A1F36', marginBottom:20 }}>{t.settings.profile}</h3>
              {/* Avatar */}
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
                <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#0179FE,#4893FF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:700, color:'white' }}>
                  {(form.voornaam[0]||'A')+(form.achternaam[0]||'A')}
                </div>
                <div>
                  <p style={{ fontSize:16, fontWeight:700, color:'#1A1F36' }}>{form.voornaam} {form.achternaam}</p>
                  <p style={{ fontSize:13, color:'#6B7280' }}>{form.email}</p>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>{t.settings.first_name}</label>
                    <input className="input-field" value={form.voornaam} onChange={e=>setForm(f=>({...f,voornaam:e.target.value}))} placeholder="Voornaam"/>
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>{t.settings.last_name}</label>
                    <input className="input-field" value={form.achternaam} onChange={e=>setForm(f=>({...f,achternaam:e.target.value}))} placeholder="Achternaam"/>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>{t.settings.email}</label>
                  <input className="input-field" value={form.email} disabled style={{ opacity:.6, cursor:'not-allowed' }}/>
                </div>
                <button className="btn-primary" style={{ width:'auto', alignSelf:'flex-start' }} onClick={saveProfiel} disabled={saving}>
                  {saving ? t.common.loading : t.settings.save}
                </button>
              </div>
            </div>
          )}

          {/* TAAL TAB — elegante compacte taal kiezer */}
          {tab==='taal' && (
            <div>
              <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, color:'#1A1F36', marginBottom:8 }}>{t.settings.language}</h3>
              <p style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>{t.settings.choose_lang}</p>

              {/* Compacte horizontale kiezer */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
                {(Object.entries(LANG_LABELS) as [Lang, typeof LANG_LABELS.nl][]).map(([k, v])=>(
                  <button key={k} onClick={()=>setSelectedLang(k)} style={{
                    display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:10,
                    border: selectedLang===k?'2px solid #0179FE':'1.5px solid #E5E7EB',
                    background: selectedLang===k?'linear-gradient(135deg,#EFF6FF,#DBEAFE)':'white',
                    cursor:'pointer', transition:'all .15s',
                    boxShadow: selectedLang===k?'0 2px 8px rgba(1,121,254,.15)':'none',
                  }}>
                    <span style={{ fontSize:20 }}>{v.flag}</span>
                    <span style={{ fontSize:13, fontWeight:selectedLang===k?700:500, color:selectedLang===k?'#0179FE':'#374151' }}>{v.label}</span>
                    {selectedLang===k && <CheckCircle size={14} color="#0179FE"/>}
                  </button>
                ))}
              </div>

              {selectedLang==='ar' && (
                <div style={{ background:'#FFFBEB', borderRadius:8, padding:'10px 14px', marginBottom:16, border:'1px solid #FDE68A' }}>
                  <p style={{ fontSize:12, color:'#92400E' }}>✏️ Arabisch activeert RTL (rechts-naar-links) tekstrichting in de app.</p>
                </div>
              )}

              <button className="btn-primary" style={{ width:'auto' }} onClick={saveLang} disabled={saving}>
                {saving ? t.common.loading : t.settings.save}
              </button>
            </div>
          )}

          {/* NOTIFICATIES TAB */}
          {tab==='notificaties' && (
            <div>
              <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, color:'#1A1F36', marginBottom:8 }}>Notificaties</h3>
              <p style={{ fontSize:13, color:'#6B7280', marginBottom:24 }}>
                Ontvang meldingen op je apparaat — ook als de app niet open is.
              </p>

              {/* PushButton component */}
              <div className="card" style={{ padding:20, marginBottom:16 }}>
                <PushButton variant="full"/>
              </div>

              {/* Info over wat je ontvangt */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <p style={{ fontSize:12, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.07em' }}>Wanneer ontvang je een melding?</p>
                {[
                  { emoji:'⚠️', label:'Budget bijna vol',         detail:'Als een categorie > 80% van het budget gebruikt' },
                  { emoji:'💳', label:'Grote transactie',          detail:'Bij een uitgave boven €100' },
                  { emoji:'📅', label:'Schuld aflossing nadert',   detail:'3 dagen voor een geplande aflossing' },
                  { emoji:'🎯', label:'Doel bereikt',              detail:'Als een spaardoel 100% is' },
                  { emoji:'⚡', label:'Laag saldo',               detail:'Als rekening saldo onder €500 komt' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{item.emoji}</span>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{item.label}</p>
                      <p style={{ fontSize:11, color:'#9CA3AF' }}>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI TAB — server-side AI, geen key nodig */}
          {tab==='ai' && (
            <div>
              <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, color:'#1A1F36', marginBottom:8 }}>AI & Koppelingen</h3>
              <p style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>
                Household gebruikt meerdere AI en externe API koppelingen. Deze zijn server-side geconfigureerd en werken automatisch.
              </p>

              {/* API koppelingen overzicht */}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
                {[
                  { naam:'Claude AI (Anthropic)',    beschrijving:'AI chatbot, bon scanner, document analyse, maandrapport', icoon:'🤖', actief:true },
                  { naam:'SerpAPI',                  beschrijving:'Prijsradar — Google Shopping resultaten', icoon:'🔍', actief:true },
                  { naam:'Brandfetch',               beschrijving:'Winkellogi\'s bij transacties', icoon:'🏪', actief:true },
                  { naam:'OpenWeatherMap',           beschrijving:'Weer widget op locatie pagina', icoon:'🌤️', actief:true },
                  { naam:'AviationStack',            beschrijving:'Vlucht tracker (status & tijden)', icoon:'✈️', actief:true },
                  { naam:'Bitvavo',                  beschrijving:'Crypto portfolio (read-only)', icoon:'₿', actief:true },
                  { naam:'Exchange Rate API',        beschrijving:'Live wisselkoersen (geen key nodig)', icoon:'💱', actief:true },
                  { naam:'Google Places',            beschrijving:'Winkels in de buurt', icoon:'📍', actief:true },
                  { naam:'Supabase',                 beschrijving:'Database — al jouw persoonlijke data', icoon:'🗄️', actief:true },
                ].map(api=>(
                  <div key={api.naam} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', background:'#F9FAFB', borderRadius:10, border:'1px solid #F3F4F6' }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{api.icoon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36' }}>{api.naam}</p>
                      <p style={{ fontSize:11, color:'#9CA3AF' }}>{api.beschrijving}</p>
                    </div>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:'#22C55E' }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', display:'inline-block' }}/>
                      Actief
                    </span>
                  </div>
                ))}
              </div>

              {/* Behoud optie voor optionele persoonlijke AI key */}
              <details style={{ marginTop:8 }}>
                <summary style={{ fontSize:12, color:'#9CA3AF', cursor:'pointer', padding:'4px 0' }}>
                  Optioneel: eigen Claude API key voor extra gebruik
                </summary>
                <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:10 }}>
                  <p style={{ fontSize:12, color:'#6B7280' }}>
                    Niet nodig — de app heeft al een gedeelde Claude API key. Voeg alleen toe als je meer capaciteit wil.
                  </p>
                  <input className="input-field" type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-..."/>
                  <button className="btn-ghost" style={{ width:'auto', fontSize:12 }} onClick={saveApiKey}>Opslaan</button>
                </div>
              </details>
            </div>
          )}

          {/* SUPABASE TAB */}
          {tab==='supabase' && (
            <div>
              <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, color:'#1A1F36', marginBottom:20 }}>{t.settings.supabase}</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { label:'Project URL', value:'lttxjfrtfrjnlazmbcyq.supabase.co', ok:true },
                  { label:'Verbinding',  value:'Actief', ok:true },
                  { label:'Tabellen',    value:'transactions, accounts, budgets, schulden, goals, profielen', ok:true },
                ].map(r=>(
                  <div key={r.label} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:r.ok?'#22C55E':'#EF4444', flexShrink:0 }}/>
                    <div>
                      <p style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>{r.label}</p>
                      <p style={{ fontSize:13, color:'#1A1F36', fontFamily:"'JetBrains Mono',monospace" }}>{r.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REGELS TAB */}
          {tab==='regels' && (
            <div>
              <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, color:'#1A1F36', marginBottom:8 }}>{t.settings.rules}</h3>
              <p style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>Automatische categorisatie op basis van omschrijving.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { zoek:'AH ', cat:'Boodschappen' }, { zoek:'JUMBO', cat:'Boodschappen' },
                  { zoek:'NS ', cat:'Transport' }, { zoek:'SPOTIFY', cat:'Abonnement' },
                  { zoek:'SALARIS', cat:'Salaris' }, { zoek:'FREELANCE', cat:'Zakelijk' },
                ].map((r,i)=>(
                  <div key={i} className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                    <span className="badge badge-gray">als &quot;{r.zoek}&quot;</span>
                    <span style={{ fontSize:13, color:'#9CA3AF' }}>→</span>
                    <span className="badge badge-blue">{r.cat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
