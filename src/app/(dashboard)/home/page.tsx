'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { getGreeting } from '@/lib/translations';
import {
  Wallet, TrendingUp, TrendingDown, Activity,
  ArrowUpRight, PlusCircle, Eye, EyeOff,
} from 'lucide-react';
import type { Transactie, Rekening, Budget, Schuld, Doel } from '@/types';

/* ─── Helpers ─────────────────────────────────────────── */
const fmtEuro = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

const CAT_ICON: Record<string, string> = {
  Boodschappen: '🛒', Eten: '🍔', Transport: '🚗', Wonen: '🏠',
  Gezondheid: '💊', Salaris: '💰', Inkomen: '💰', Zakelijk: '💼',
  Abonnement: '📱', Kleding: '👕', Sport: '🏋️', Overig: '📄',
};

const BAR_KLEUR: Record<string, string> = {
  blue: 'linear-gradient(135deg,#0179FE,#4893FF)',
  teal: 'linear-gradient(135deg,#01797A,#489399)',
  purple: 'linear-gradient(135deg,#6172F3,#A855F7)',
  green: 'linear-gradient(135deg,#059669,#34D399)',
};

export default function HomePage() {
  const { t, lang }    = useLang();
  const [tx,    setTx]   = useState<Transactie[]>([]);
  const [rek,   setRek]  = useState<Rekening[]>([]);
  const [bud,   setBud]  = useState<Budget[]>([]);
  const [sch,   setSch]  = useState<Schuld[]>([]);
  const [doel,  setDoel] = useState<Doel[]>([]);
  const [naam,  setNaam] = useState('Abdul');
  const [loading, setLoad] = useState(true);
  const [hideSaldo, setHideSaldo] = useState(false);
  const sb = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const [a, b, c, d, e, f] = await Promise.all([
        sb.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
        sb.from('accounts').select('*').eq('user_id', user.id),
        sb.from('budgets').select('*').eq('user_id', user.id),
        sb.from('schulden').select('*').eq('user_id', user.id),
        sb.from('goals').select('*').eq('user_id', user.id),
        sb.from('profielen').select('voornaam').eq('id', user.id).single(),
      ]);
      setTx(  (a.data || []) as unknown as Transactie[]);
      setRek( (b.data || []) as unknown as Rekening[]);
      setBud( (c.data || []) as unknown as Budget[]);
      setSch( (d.data || []) as unknown as Schuld[]);
      setDoel((e.data || []) as unknown as Doel[]);
      if (f.data?.voornaam) setNaam(f.data.voornaam);
      setLoad(false);
    })();
  }, []);

  /* ── KPI berekeningen ───────────────────────────────── */
  const now   = new Date();
  const mTx   = tx.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const inc   = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp   = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netto = inc - exp;
  const saldo = tx.reduce((s, t) => s + (t.type === 'income' ? 1 : -1) * t.amount, 0);
  const totaalSchuld = sch.reduce((s, d) => s + (d.oorspronkelijk - d.afgelost), 0);

  const budMet = bud.map(b => ({
    ...b,
    werkelijk: mTx.filter(t => t.type === 'expense' && t.category === b.category)
                  .reduce((s, t) => s + t.amount, 0),
  }));

  const kpis = [
    { label: t.dashboard.total_balance,   value: saldo, icon: Wallet,       color: '#0179FE', border: '#0179FE', bg: '#EFF6FF' },
    { label: t.dashboard.month_income,    value: inc,   icon: TrendingUp,   color: '#22C55E', border: '#22C55E', bg: '#F0FDF4' },
    { label: t.dashboard.month_expenses,  value: exp,   icon: TrendingDown, color: '#EF4444', border: '#EF4444', bg: '#FEF2F2' },
    { label: t.dashboard.month_net,       value: netto, icon: Activity,
      color: netto >= 0 ? '#22C55E' : '#EF4444',
      border: netto >= 0 ? '#22C55E' : '#EF4444',
      bg:    netto >= 0 ? '#F0FDF4' : '#FEF2F2',
    },
  ];

  const greeting = getGreeting(lang, now.getHours());
  const todayStr = now.toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'hy' ? 'hy-AM' : lang === 'en' ? 'en-GB' : 'nl-NL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <section className="home">

      {/* ══ Hoofd content ═══════════════════════════════════ */}
      <div className="home-content no-scrollbar">

        {/* Header box */}
        <div className="header-box">
          <h1 className="header-box-title">
            {greeting}, {naam}! 👋
          </h1>
          <p className="header-box-subtext">{t.dashboard.subtitle}</p>
        </div>

        {/* Total balance card */}
        <div className="total-balance fade-up" style={{ marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t.dashboard.total_balance}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p className="amount" style={{ fontSize: 34, color: '#fff', lineHeight: 1 }}>
                {loading ? '—' : hideSaldo ? '••••••' : fmtEuro(saldo)}
              </p>
              <button
                onClick={() => setHideSaldo(h => !h)}
                style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'white' }}
              >
                {hideSaldo ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, background: 'rgba(34,197,94,.25)', color: '#4ADE80', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                  ↑ {loading ? '—' : fmtEuro(inc)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, background: 'rgba(239,68,68,.25)', color: '#FCA5A5', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                  ↓ {loading ? '—' : fmtEuro(exp)}
                </span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>
              {todayStr}
            </p>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 24 }}>
          {kpis.map(({ label, value, icon: Icon, color, border, bg }) => (
            <div key={label} className="kpi-card card-hover" style={{ borderLeftColor: border }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ fontSize: 10, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {label}
                </p>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color={color} />
                </div>
              </div>
              <p className="amount" style={{ fontSize: 20, color: loading ? '#D1D5DB' : color }}>
                {loading ? '—' : fmtEuro(value)}
              </p>
            </div>
          ))}
        </div>

        {/* Recente transacties */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1F36' }}>
              {t.dashboard.recent_transactions}
            </h3>
            <Link href="/transacties" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0179FE', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              {t.dashboard.view_all} <ArrowUpRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
            </div>
          ) : tx.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>📊</p>
              <p style={{ fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>{t.dashboard.no_transactions}</p>
              <Link href="/transacties"><button className="btn-primary" style={{ marginTop: 12 }}>+ {t.transactions.add}</button></Link>
            </div>
          ) : (
            tx.slice(0, 8).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#F3F4F6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                  {CAT_ICON[t.category] || '📄'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span className={`badge ${t.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                      {t.category}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, marginRight: 8 }}>{fmtDate(t.date)}</p>
                <p className="amount" style={{ fontSize: 13, flexShrink: 0, color: t.type === 'income' ? '#22C55E' : '#EF4444' }}>
                  {t.type === 'income' ? '+' : '-'}{fmtEuro(t.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ══ Right sidebar ═══════════════════════════════════ */}
      <aside className="right-sidebar no-scrollbar">

        {/* Rekeningen */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>{t.dashboard.my_accounts}</h3>
            <Link href="/rekeningen" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0179FE', textDecoration: 'none', fontWeight: 600 }}>
              <PlusCircle size={12} /> {t.dashboard.add_account}
            </Link>
          </div>
          {rek.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '10px 0' }}>{t.dashboard.no_accounts}</p>
          ) : rek.slice(0, 3).map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ width: 4, height: 34, borderRadius: 2, flexShrink: 0, background: BAR_KLEUR[r.color_gradient] || BAR_KLEUR.blue }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF' }}>{r.account_number_masked}</p>
              </div>
              <p className="amount" style={{ fontSize: 13, color: '#1A1F36', flexShrink: 0 }}>{fmtEuro(r.balance)}</p>
            </div>
          ))}
          <Link href="/rekeningen" style={{ fontSize: 12, color: '#0179FE', textDecoration: 'none', fontWeight: 600, display: 'block', marginTop: 8 }}>
            {t.dashboard.all_accounts} →
          </Link>
        </div>

        {/* Budgetten */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>{t.dashboard.budgets}</h3>
            <Link href="/begroting" style={{ fontSize: 12, color: '#0179FE', textDecoration: 'none', fontWeight: 600 }}>{t.dashboard.manage} →</Link>
          </div>
          {budMet.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '10px 0' }}>{t.dashboard.no_budgets}</p>
          ) : budMet.slice(0, 4).map(b => {
            const pct   = b.monthly_limit > 0 ? Math.min(100, (b.werkelijk / b.monthly_limit) * 100) : 0;
            const kleur = pct < 70 ? '#22C55E' : pct < 90 ? '#F59E0B' : '#EF4444';
            return (
              <div key={b.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1F36' }}>{b.category}</span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{fmtEuro(b.werkelijk)} / {fmtEuro(b.monthly_limit)}</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: pct + '%', background: kleur }} /></div>
              </div>
            );
          })}
        </div>

        {/* Schulden */}
        {sch.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>{t.dashboard.debts}</h3>
              <Link href="/schulden" style={{ fontSize: 12, color: '#0179FE', textDecoration: 'none', fontWeight: 600 }}>{t.dashboard.all_debts} →</Link>
            </div>
            <p className="amount" style={{ fontSize: 20, color: '#EF4444', marginBottom: 10 }}>-{fmtEuro(totaalSchuld)}</p>
            {sch.slice(0, 3).map(s => {
              const rest = s.oorspronkelijk - s.afgelost;
              const pct  = s.oorspronkelijk > 0 ? (s.afgelost / s.oorspronkelijk) * 100 : 0;
              return (
                <div key={s.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1F36' }}>{s.schuldeiser}</span>
                    <span className="amount" style={{ fontSize: 11, color: '#EF4444' }}>-{fmtEuro(rest)}</span>
                  </div>
                  <div className="progress-track" style={{ background: '#FEE2E2' }}>
                    <div className="progress-fill" style={{ width: pct + '%', background: '#22C55E' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Doelen */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>{t.dashboard.goals}</h3>
            <Link href="/doelen" style={{ fontSize: 12, color: '#0179FE', textDecoration: 'none', fontWeight: 600 }}>{t.dashboard.all_goals} →</Link>
          </div>
          {doel.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '10px 0' }}>{t.dashboard.no_goals}</p>
          ) : doel.slice(0, 3).map(d => {
            const pct = d.target_amount > 0 ? Math.min(100, (d.current_amount / d.target_amount) * 100) : 0;
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F3F4F6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {d.emoji || '🎯'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</p>
                  <div className="progress-track" style={{ marginTop: 4 }}>
                    <div className="progress-fill" style={{ width: pct + '%', background: '#0179FE' }} />
                  </div>
                  <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{Math.round(pct)}% — {fmtEuro(d.current_amount)} {t.common.of} {fmtEuro(d.target_amount)}</p>
                </div>
              </div>
            );
          })}
        </div>

      </aside>
    </section>
  );
}
