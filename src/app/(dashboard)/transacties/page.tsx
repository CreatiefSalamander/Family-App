'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { Search, Plus, Upload, Camera } from 'lucide-react';
import type { Transactie } from '@/types';
import BonScanner from '@/components/finance/BonScanner';

const fmtEuro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

const CAT_ICON: Record<string, string> = {
  Boodschappen:'🛒', Eten:'🍔', Transport:'🚗', Wonen:'🏠', Gezondheid:'💊',
  Salaris:'💰', Inkomen:'💰', Zakelijk:'💼', Abonnement:'📱', Kleding:'👕', Overig:'📄',
};
const CATS = ['Boodschappen','Eten','Transport','Wonen','Gezondheid','Salaris','Inkomen','Zakelijk','Abonnement','Kleding','Sport','Belasting','Verzekering','Overig'];
const PER_PAGE = 20;

// Geldige cat-badge klassen (Horizon stijl)
const CAT_CLASSES = new Set(['boodschappen','eten','transport','wonen','gezondheid','salaris','inkomen','zakelijk','abonnement','kleding','sport','belasting','verzekering']);

// CategoryBadge — gekleurde stip + gekleurde border per categorie
function CategoryBadge({ category }: { category: string }) {
  const key = category.toLowerCase().replace(/\s+/g, '-');
  const cls = CAT_CLASSES.has(key) ? `cat-${key}` : 'cat-default';
  return (
    <span className={`cat-badge ${cls}`}>
      <span className="cat-dot" />
      {category}
    </span>
  );
}

export default function TransactiesPage() {
  const { t } = useLang();
  const [tx, setTx]         = useState<Transactie[]>([]);
  const [loading, setLoad]  = useState(true);
  const [query, setQuery]   = useState('');
  const [typ, setTyp]       = useState('all');
  const [cat, setCat]       = useState('');
  const [pg, setPg]         = useState(1);
  const [bonOpen, setBonOpen] = useState(false);
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
            <button className="btn-ghost tx-import-btn" style={{ fontSize:13 }}><Upload size={15}/> {t.transactions.import}</button>
            <button className="btn-ghost" style={{ fontSize:13 }} onClick={()=>setBonOpen(true)}><Camera size={15}/> 📸 Bon</button>
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
            <p className="amount" style={{ fontSize:'clamp(13px,3.5vw,18px)', color:s.color, marginTop:4 }}>{fmtEuro(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      {/* Filterbalk: zoekbalk altijd bovenaan, selects eronder op mobiel */}
      <div className="card" style={{ padding:'clamp(12px,3vw,16px)', marginBottom:16 }}>
        <div style={{ position:'relative', marginBottom:10 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
          <input className="input-field" value={query} onChange={e=>{ setQuery(e.target.value); setPg(1); }}
            placeholder={t.transactions.search} style={{ paddingLeft:34, width:'100%' }}/>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <select className="input-field" value={typ} onChange={e=>{ setTyp(e.target.value); setPg(1); }} style={{ flex:1, minWidth:'clamp(100px,28vw,130px)' }}>
            <option value="all">{t.transactions.all}</option>
            <option value="income">{t.transactions.income}</option>
            <option value="expense">{t.transactions.expense}</option>
          </select>
          <select className="input-field" value={cat} onChange={e=>{ setCat(e.target.value); setPg(1); }} style={{ flex:2, minWidth:'clamp(120px,36vw,150px)' }}>
            <option value="">{t.transactions.filter_cat}</option>
            {CATS.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
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
            {/* Tabel header — verborgen op mobiel via .tx-table-header class */}
            <div className="tx-table-header" style={{ display:'grid', gridTemplateColumns:'40px 1fr 110px 90px 110px', gap:12, padding:'10px 20px', borderBottom:'1px solid #F3F4F6' }}>
              {['','Omschrijving','Categorie','Datum','Bedrag'].map(h=>(
                <p key={h} style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</p>
              ))}
            </div>
            {/* Transactie rijen — flex kaart-layout, Horizon rij-kleuren */}
            {slice.map(item=>{
              const isIncome = item.type === 'income';
              // Rij achtergrond: groen-tinted voor inkomst, rood-tinted voor uitgave (Horizon stijl)
              const rowBg = isIncome ? '#F6FEF9' : '#FFFBFA';
              const rowHover = isIncome ? '#ECFDF3' : '#FEF2F2';
              return (
              <div key={item.id}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid #F9FAFB', background:rowBg, transition:'background .15s' }}
                onMouseEnter={e=>(e.currentTarget.style.background=rowHover)}
                onMouseLeave={e=>(e.currentTarget.style.background=rowBg)}>
                {/* Categorie icoon */}
                <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,.7)', border:'1px solid #F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {CAT_ICON[item.category]||'📄'}
                </div>
                {/* Omschrijving + gekleurde badge */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'#344054', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.description}
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                    <CategoryBadge category={item.category} />
                    <span className="tx-col-datum" style={{ fontSize:11, color:'#9CA3AF' }}>{fmtDate(item.date)}</span>
                  </div>
                </div>
                {/* Bedrag rechts */}
                <div style={{ flexShrink:0, textAlign:'right' }}>
                  <p className="amount" style={{ fontSize:14, color:isIncome?'#039855':'#F04438' }}>
                    {isIncome?'+':'-'}{fmtEuro(item.amount)}
                  </p>
                  <p className="tx-col-datum" style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{fmtDate(item.date)}</p>
                </div>
              </div>
            );})}
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

      {/* Modal — bottom sheet op mobiel, centered card op desktop */}
      {show && (
        <>
          <div
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:100, backdropFilter:'blur(4px)' }}
            onClick={() => !saving && setShow(false)}
          />
          <div className="tx-modal" style={{
            position:'fixed', zIndex:101,
            bottom:0, left:0, right:0,
            background:'#fff',
            borderRadius:'20px 20px 0 0',
            padding:'20px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
            boxShadow:'0 -8px 40px rgba(0,0,0,.2)',
            animation:'txSheetUp .3s cubic-bezier(.16,1,.3,1)',
          }}>
            {/* Drag handle */}
            <div style={{ width:36, height:4, borderRadius:2, background:'#E5E7EB', margin:'0 auto 18px' }} />

            <h3 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:18, fontWeight:700, color:'#1A1F36', marginBottom:18 }}>
              {t.transactions.add}
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input className="input-field" placeholder="Omschrijving" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <input className="input-field" type="number" placeholder="Bedrag (€)" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
                <select className="input-field" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  <option value="expense">{t.transactions.expense}</option>
                  <option value="income">{t.transactions.income}</option>
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <select className="input-field" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
                <input className="input-field" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="btn-ghost" style={{ flex:1, minHeight:44 }} onClick={()=>setShow(false)}>{t.common.cancel}</button>
                <button className="btn-primary" style={{ flex:2, minHeight:44 }} onClick={addTx} disabled={saving}>{saving?t.common.loading:t.common.add}</button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes txSheetUp { from { transform:translateY(60px); opacity:0; } to { transform:translateY(0); opacity:1; } }
            @media (min-width:768px) {
              .tx-modal {
                bottom:auto!important; left:50%!important; right:auto!important;
                top:50%!important; transform:translate(-50%,-50%)!important;
                width:440px!important; border-radius:20px!important; animation:none!important;
              }
            }
          `}</style>
        </>
      )}

      {/* FAB */}
      <button className="btn-primary" onClick={()=>setShow(true)} style={{ position:'fixed', bottom:102, right:20, width:52, height:52, borderRadius:'50%', padding:0, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(1,121,254,.4)', zIndex:40 }}>
        <Plus size={22}/>
      </button>

      {/* Bon Scanner */}
      {bonOpen && (
        <BonScanner
          onSluiten={() => setBonOpen(false)}
          onToevoegen={async (bon) => {
            const { data: { user } } = await sb.auth.getUser();
            if (!user) return;
            const { data } = await sb.from('transactions').insert({
              user_id: user.id, amount: bon.bedrag, type:'expense',
              description: bon.winkel, category: bon.categorie,
              date: bon.datum, source:'Bon scanner', status:'OK',
              is_zakelijk:false, type_soort:'Uitgave',
            }).select().single();
            if (data) setTx(prev => [data as unknown as Transactie, ...prev]);
          }}
        />
      )}
    </div>
  );
}
