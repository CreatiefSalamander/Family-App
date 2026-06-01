'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { Search, Plus, Upload } from 'lucide-react';
import type { Transactie } from '@/types';

const fmtEuro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

const CAT_ICON: Record<string, string> = {
  Boodschappen:'🛒', Eten:'🍔', Transport:'🚗', Wonen:'🏠', Gezondheid:'💊',
  Salaris:'💰', Inkomen:'💰', Zakelijk:'💼', Abonnement:'📱', Kleding:'👕', Overig:'📄',
};
const CATS = ['Boodschappen','Eten','Transport','Wonen','Gezondheid','Salaris','Inkomen','Zakelijk','Abonnement','Kleding','Sport','Belasting','Verzekering','Overig'];
const PER_PAGE = 20;

export default function TransactiesPage() {
  const { t } = useLang();
  const [tx, setTx]         = useState<Transactie[]>([]);
  const [loading, setLoad]  = useState(true);
  const [query, setQuery]   = useState('');
  const [typ, setTyp]       = useState('all');
  const [cat, setCat]       = useState('');
  const [pg, setPg]         = useState(1);
  const [show, setShow]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({ description:'', amount:'', type:'expense', category:'Overig', date: new Date().toISOString().split('T')[0] });
  const sb = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
      setTx((data || []) as unknown as Transactie[]);
      setLoad(false);
    })();
  }, []);

  const filtered = tx.filter(item => {
    const q = query.toLowerCase();
    return (!q || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
      && (typ === 'all' || item.type === typ)
      && (!cat || item.category === cat);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const slice = filtered.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);
  const totalInc = filtered.filter(x => x.type === 'income').reduce((s, x) => s + x.amount, 0);
  const totalExp = filtered.filter(x => x.type === 'expense').reduce((s, x) => s + x.amount, 0);

  async function addTx() {
    setSaving(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }
    const amt = parseFloat(form.amount);
    if (!amt || !form.description) { setSaving(false); return; }
    const { data } = await sb.from('transactions').insert({
      user_id: user.id, amount: Math.abs(amt), type: form.type,
      description: form.description, category: form.category, date: form.date,
      source: 'Handmatig', status: 'OK', is_zakelijk: false,
      type_soort: form.type === 'income' ? 'Inkomst' : 'Uitgave',
    }).select().single();
    if (data) setTx(prev => [data as unknown as Transactie, ...prev]);
    setShow(false); setSaving(false);
    setForm({ description:'', amount:'', type:'expense', category:'Overig', date: new Date().toISOString().split('T')[0] });
  }

  return (
    <div className="home-content no-scrollbar">

      <div className="header-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h1 className="header-box-title">{t.transactions.title}</h1>
            <p className="header-box-subtext">{t.transactions.subtitle}</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn-ghost" style={{ fontSize:13 }}><Upload size={15}/> {t.transactions.import}</button>
            <button className="btn-primary" style={{ fontSize:13 }} onClick={() => setShow(true)}><Plus size={15}/> {t.transactions.add}</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:t.dashboard.income,   value:totalInc, color:'#22C55E', bg:'#F0FDF4' },
          { label:t.dashboard.expenses, value:totalExp, color:'#EF4444', bg:'#FEF2F2' },
          { label:t.dashboard.net,      value:totalInc-totalExp, color:(totalInc-totalExp)>=0?'#22C55E':'#EF4444', bg:'#F9FAFB' },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:16, background:s.bg, border:'none' }}>
            <p style={{ fontSize:11, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em' }}>{s.label}</p>
            <p className="amount" style={{ fontSize:18, color:s.color, marginTop:4 }}>{fmtEuro(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding:16, marginBottom:16, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
          <input className="input-field" value={query} onChange={e=>{ setQuery(e.target.value); setPg(1); }}
            placeholder={t.transactions.search} style={{ paddingLeft:34 }}/>
        </div>
        <select className="input-field" value={typ} onChange={e=>{ setTyp(e.target.value); setPg(1); }} style={{ width:130 }}>
          <option value="all">{t.transactions.all}</option>
          <option value="income">{t.transactions.income}</option>
          <option value="expense">{t.transactions.expense}</option>
        </select>
        <select className="input-field" value={cat} onChange={e=>{ setCat(e.target.value); setPg(1); }} style={{ width:150 }}>
          <option value="">{t.transactions.filter_cat}</option>
          {CATS.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabel */}
      <div className="card" style={{ overflow:'hidden', marginBottom:16 }}>
        {loading ? (
          <div style={{ padding:24 }}>{[...Array(8)].map((_,i)=><div key={i} className="skeleton" style={{ height:48, marginBottom:8 }}/>)}</div>
        ) : slice.length===0 ? (
          <div style={{ textAlign:'center', padding:'48px 24px' }}>
            <p style={{ fontSize:36, marginBottom:8 }}>🔍</p>
            <p style={{ fontWeight:600, color:'#4B5563' }}>{t.transactions.no_results}</p>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 110px 90px 110px', gap:12, padding:'10px 20px', borderBottom:'1px solid #F3F4F6' }}>
              {['','Omschrijving','Categorie','Datum','Bedrag'].map(h=>(
                <p key={h} style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</p>
              ))}
            </div>
            {slice.map(item=>(
              <div key={item.id} style={{ display:'grid', gridTemplateColumns:'40px 1fr 110px 90px 110px', gap:12, padding:'11px 20px', borderBottom:'1px solid #F9FAFB', alignItems:'center' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#F9FAFB')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>
                  {CAT_ICON[item.category]||'📄'}
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'#1A1F36', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.description}</p>
                  <p style={{ fontSize:11, color:'#9CA3AF' }}>{item.source}</p>
                </div>
                <span className={`badge ${item.type==='income'?'badge-green':'badge-gray'}`}>{item.category}</span>
                <p style={{ fontSize:12, color:'#6B7280' }}>{fmtDate(item.date)}</p>
                <p className="amount" style={{ fontSize:13, color:item.type==='income'?'#22C55E':'#EF4444' }}>
                  {item.type==='income'?'+':'-'}{fmtEuro(item.amount)}
                </p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Paginatie */}
      {pages>1&&(
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:16 }}>
          {[...Array(Math.min(pages,7))].map((_,i)=>(
            <button key={i+1} onClick={()=>setPg(i+1)} style={{ width:36, height:36, borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, background:pg===i+1?'#0179FE':'#F3F4F6', color:pg===i+1?'#fff':'#6B7280' }}>
              {i+1}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {show&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={e=>e.target===e.currentTarget&&setShow(false)}>
          <div className="card" style={{ width:440, padding:28 }}>
            <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, color:'#1A1F36', marginBottom:20 }}>{t.transactions.add}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <input className="input-field" placeholder="Omschrijving" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input className="input-field" type="number" placeholder="Bedrag (€)" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
                <select className="input-field" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  <option value="expense">{t.transactions.expense}</option>
                  <option value="income">{t.transactions.income}</option>
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <select className="input-field" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
                <input className="input-field" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:6 }}>
                <button className="btn-ghost" style={{ flex:1 }} onClick={()=>setShow(false)}>{t.common.cancel}</button>
                <button className="btn-primary" style={{ flex:1 }} onClick={addTx} disabled={saving}>{saving?t.common.loading:t.common.add}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button className="btn-primary" onClick={()=>setShow(true)} style={{ position:'fixed', bottom:88, right:24, width:52, height:52, borderRadius:'50%', padding:0, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(1,121,254,.4)', zIndex:40 }}>
        <Plus size={22}/>
      </button>
    </div>
  );
}
