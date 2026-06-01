'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { Plus, CreditCard, Eye, EyeOff } from 'lucide-react';
import type { Rekening } from '@/types';

const fmtEuro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

const GRADIENTS: Record<string, string> = {
  blue:   'linear-gradient(135deg, #0179FE 0%, #4893FF 100%)',
  teal:   'linear-gradient(135deg, #01797A 0%, #489399 100%)',
  purple: 'linear-gradient(135deg, #6172F3 0%, #A855F7 100%)',
  green:  'linear-gradient(135deg, #059669 0%, #34D399 100%)',
};
const GRAD_KEYS = Object.keys(GRADIENTS);

export default function RekeningenPage() {
  const { t } = useLang();
  const [rek, setRek] = useState<Rekening[]>([]);
  const [loading, setLoad] = useState(true);
  const [hide, setHide] = useState(false);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', bank_name:'', account_number_masked:'', balance:'', color_gradient:'blue' });
  const sb = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('accounts').select('*').eq('user_id', user.id).order('name');
      setRek((data||[]) as unknown as Rekening[]);
      setLoad(false);
    })();
  }, []);

  const totaal = rek.reduce((s, r) => s + r.balance, 0);

  async function addRek() {
    setSaving(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data } = await sb.from('accounts').insert({
      user_id: user.id, name: form.name, bank_name: form.bank_name,
      account_number_masked: form.account_number_masked,
      balance: parseFloat(form.balance)||0, color_gradient: form.color_gradient,
    }).select().single();
    if (data) setRek(prev => [...prev, data as unknown as Rekening]);
    setShow(false); setSaving(false);
    setForm({ name:'', bank_name:'', account_number_masked:'', balance:'', color_gradient:'blue' });
  }

  return (
    <div className="home-content no-scrollbar">
      <div className="header-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h1 className="header-box-title">{t.accounts.title}</h1>
            <p className="header-box-subtext">{t.accounts.subtitle}</p>
          </div>
          <button className="btn-primary" style={{ fontSize:13 }} onClick={()=>setShow(true)}><Plus size={15}/> {t.accounts.add}</button>
        </div>
      </div>

      {/* Totaal saldo */}
      <div className="total-balance fade-up" style={{ marginBottom:28 }}>
        <div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,.75)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>
            Totaal vermogen
          </p>
          <p className="amount" style={{ fontSize:34, color:'#fff' }}>
            {hide ? '••••••' : fmtEuro(totaal)}
          </p>
          <p style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginTop:4 }}>{rek.length} rekening{rek.length !== 1 ? 'en' : ''}</p>
        </div>
        <button onClick={()=>setHide(h=>!h)} style={{ background:'rgba(255,255,255,.2)', border:'none', borderRadius:8, padding:'8px 12px', cursor:'pointer', color:'white', display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
          {hide ? <Eye size={16}/> : <EyeOff size={16}/>} {hide ? 'Toon' : 'Verberg'}
        </button>
      </div>

      {/* Bank cards grid */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
          {[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height:180, borderRadius:16 }}/>)}
        </div>
      ) : rek.length===0 ? (
        <div className="card" style={{ padding:48, textAlign:'center' }}>
          <CreditCard size={48} color="#E5E7EB" style={{ margin:'0 auto 16px' }}/>
          <p style={{ fontWeight:600, color:'#4B5563', marginBottom:4 }}>{t.accounts.no_accounts}</p>
          <button className="btn-primary" style={{ marginTop:16, width:'auto' }} onClick={()=>setShow(true)}>{t.accounts.add}</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
          {rek.map(r => (
            <div key={r.id} className="bank-card fade-up" style={{ background: GRADIENTS[r.color_gradient]||GRADIENTS.blue }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,.75)', fontWeight:600 }}>{r.bank_name}</p>
                  <p style={{ fontSize:17, fontWeight:700, color:'#fff', marginTop:4 }}>{r.name}</p>
                </div>
                <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <CreditCard size={20} color="white"/>
                </div>
              </div>
              <div>
                <p style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginBottom:4, fontWeight:600 }}>REKENINGNUMMER</p>
                <p style={{ fontSize:14, color:'rgba(255,255,255,.9)', letterSpacing:'2px', fontFamily:"'JetBrains Mono',monospace" }}>
                  {hide ? '•••• •••• ••••' : r.account_number_masked}
                </p>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginBottom:4, fontWeight:600 }}>SALDO</p>
                  <p className="amount" style={{ fontSize:22, color:'#fff' }}>
                    {hide ? '••••' : fmtEuro(r.balance)}
                  </p>
                </div>
                <div className="glassmorphism" style={{ padding:'4px 10px', borderRadius:20 }}>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,.9)', fontWeight:600 }}>
                    {r.is_zakelijk ? '💼 Zakelijk' : '🏠 Privé'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {show&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={e=>e.target===e.currentTarget&&setShow(false)}>
          <div className="card" style={{ width:440, padding:28 }}>
            <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, marginBottom:20 }}>{t.accounts.add}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input className="input-field" placeholder="Naam rekening" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
                <input className="input-field" placeholder="Bank (bijv. Rabobank)" value={form.bank_name} onChange={e=>setForm(f=>({...f,bank_name:e.target.value}))}/>
              </div>
              <input className="input-field" placeholder="Rekeningnummer (bijv. NL69 RABO 0366)" value={form.account_number_masked} onChange={e=>setForm(f=>({...f,account_number_masked:e.target.value}))}/>
              <input className="input-field" type="number" placeholder="Huidig saldo (€)" value={form.balance} onChange={e=>setForm(f=>({...f,balance:e.target.value}))}/>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Kleur</p>
                <div style={{ display:'flex', gap:10 }}>
                  {GRAD_KEYS.map(k => (
                    <button key={k} onClick={()=>setForm(f=>({...f,color_gradient:k}))} style={{ width:40, height:40, borderRadius:'50%', background:GRADIENTS[k], border: form.color_gradient===k?'3px solid #1A1F36':'3px solid transparent', cursor:'pointer' }}/>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:6 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={()=>setShow(false)}>{t.common.cancel}</button>
                <button className="btn-primary" style={{ flex:1 }} onClick={addRek} disabled={saving}>{saving?t.common.loading:t.common.add}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
