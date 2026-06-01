'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { LANG_LABELS, type Lang } from '@/lib/translations';
import { User, Globe, Bot, Database, Tag, CheckCircle } from 'lucide-react';

type Tab = 'profiel' | 'taal' | 'ai' | 'supabase' | 'regels';

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
    { id:'profiel',   icon:User,     label:t.settings.profile },
    { id:'taal',      icon:Globe,    label:t.settings.language },
    { id:'ai',        icon:Bot,      label:t.settings.ai },
    { id:'supabase',  icon:Database, label:t.settings.supabase },
    { id:'regels',    icon:Tag,      label:t.settings.rules },
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
                    <input className="input-field" value={form.voornaam} onChange={e=>setForm(f=>({...f,voornaam:e.target.value}))} placeholder="Abdul"/>
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>{t.settings.last_name}</label>
                    <input className="input-field" value={form.achternaam} onChange={e=>setForm(f=>({...f,achternaam:e.target.value}))} placeholder="Aziz"/>
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

          {/* TAAL TAB */}
          {tab==='taal' && (
            <div>
              <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, color:'#1A1F36', marginBottom:8 }}>{t.settings.language}</h3>
              <p style={{ fontSize:13, color:'#6B7280', marginBottom:24 }}>{t.settings.choose_lang}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
                {(Object.entries(LANG_LABELS) as [Lang, typeof LANG_LABELS.nl][]).map(([k, v])=>(
                  <button key={k} onClick={()=>setSelectedLang(k)} style={{
                    display:'flex', alignItems:'center', gap:14, padding:18, borderRadius:12,
                    border: selectedLang===k?'2px solid #0179FE':'2px solid #E5E7EB',
                    background: selectedLang===k?'#EFF6FF':'white',
                    cursor:'pointer', transition:'all .15s', textAlign:'left',
                  }}>
                    <span style={{ fontSize:32 }}>{v.flag}</span>
                    <div>
                      <p style={{ fontSize:15, fontWeight:700, color: selectedLang===k?'#0179FE':'#1A1F36' }}>{v.label}</p>
                      <p style={{ fontSize:12, color:'#9CA3AF' }}>{v.dir==='rtl'?'RTL — rechts naar links':'LTR — links naar rechts'}</p>
                    </div>
                    {selectedLang===k && <CheckCircle size={20} color="#0179FE" style={{ marginLeft:'auto' }}/>}
                  </button>
                ))}
              </div>
              <button className="btn-primary" style={{ width:'auto' }} onClick={saveLang} disabled={saving}>
                {saving ? t.common.loading : t.settings.save}
              </button>
            </div>
          )}

          {/* AI TAB */}
          {tab==='ai' && (
            <div>
              <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, color:'#1A1F36', marginBottom:8 }}>{t.settings.ai}</h3>
              <p style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>{t.settings.api_help}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>{t.settings.api_key}</label>
                  <input className="input-field" type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder={t.settings.api_key_ph}/>
                </div>
                {apiKey && (
                  <div style={{ padding:12, background:'#F0FDF4', borderRadius:8, border:'1px solid #86EFAC' }}>
                    <p style={{ fontSize:12, color:'#16A34A', fontWeight:600 }}>✓ API key ingesteld</p>
                    <p style={{ fontSize:11, color:'#22C55E', marginTop:2 }}>sk-ant-...{apiKey.slice(-4)}</p>
                  </div>
                )}
                <button className="btn-primary" style={{ width:'auto', alignSelf:'flex-start' }} onClick={saveApiKey}>
                  {t.settings.save}
                </button>
              </div>
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
                  { zoek:'SALARIS', cat:'Salaris' }, { zoek:'Leaflink', cat:'Zakelijk' },
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
