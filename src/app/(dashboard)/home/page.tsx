'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Wallet, TrendingUp, TrendingDown, Activity,
  ArrowUpRight, Receipt, PlusCircle,
} from 'lucide-react';
import type { Transactie, Rekening, Budget, Schuld, Doel } from '@/types';

/* ─── Helpers ────────────────────────────────────────────── */
const formatEuro = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

const formatDatum = (d: string) =>
  new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

const CAT_STYLE: Record<string, { bg: string; color: string; emoji: string }> = {
  Boodschappen: { bg: '#EEF2FF', color: '#6366F1', emoji: '🛒' },
  Eten:         { bg: '#FFFBEB', color: '#F59E0B', emoji: '🍔' },
  Transport:    { bg: '#EFF6FF', color: '#3B82F6', emoji: '🚗' },
  Wonen:        { bg: '#F0FDF4', color: '#22C55E', emoji: '🏠' },
  Gezondheid:   { bg: '#FDF2F8', color: '#EC4899', emoji: '💊' },
  Salaris:      { bg: '#F0FDF4', color: '#059669', emoji: '💰' },
  Inkomen:      { bg: '#F0FDF4', color: '#059669', emoji: '💰' },
  Zakelijk:     { bg: '#EFF6FF', color: '#0179FE', emoji: '💼' },
  default:      { bg: '#F9FAFB', color: '#6B7280', emoji: '📄' },
};

const BAR_KLEUR: Record<string, string> = {
  blue:   'linear-gradient(135deg,#0179FE,#4893FF)',
  teal:   'linear-gradient(135deg,#01797A,#489399)',
  purple: 'linear-gradient(135deg,#6172F3,#A855F7)',
  green:  'linear-gradient(135deg,#059669,#34D399)',
};

/* ─── Component ──────────────────────────────────────────── */
export default function DashboardHomePage() {
  const [tx,     setTx]    = useState<Transactie[]>([]);
  const [rek,    setRek]   = useState<Rekening[]>([]);
  const [bud,    setBud]   = useState<Budget[]>([]);
  const [sch,    setSch]   = useState<Schuld[]>([]);
  const [doel,   setDoel]  = useState<Doel[]>([]);
  const [naam,   setNaam]  = useState('Abdul');
  const [loading, setLoad] = useState(true);
  const sb = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const [t, r, b, s, d, p] = await Promise.all([
        sb.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
        sb.from('accounts').select('*').eq('user_id', user.id),
        sb.from('budgets').select('*').eq('user_id', user.id),
        sb.from('schulden').select('*').eq('user_id', user.id),
        sb.from('goals').select('*').eq('user_id', user.id),
        sb.from('profielen').select('voornaam').eq('id', user.id).single(),
      ]);
      setTx((t.data  || []) as unknown as Transactie[]);
      setRek((r.data || []) as unknown as Rekening[]);
      setBud((b.data || []) as unknown as Budget[]);
      setSch((s.data || []) as unknown as Schuld[]);
      setDoel((d.data || []) as unknown as Doel[]);
      if (p.data?.voornaam) setNaam(p.data.voornaam);
      setLoad(false);
    })();
  }, []);

  /* ── KPI berekeningen ─────────────────────────────────── */
  const now  = new Date();
  const mTx  = tx.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const inc  = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp  = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netto = inc - exp;
  const saldo = tx.reduce((s, t) => s + (t.type === 'income' ? 1 : -1) * t.amount, 0);
  const totaalSchuld = sch.reduce((s, d) => s + (d.oorspronkelijk - d.afgelost), 0);

  /* ── Budget werkelijk berekenen ───────────────────────── */
  const budMet = bud.map(b => {
    const werkelijk = mTx
      .filter(t => t.type === 'expense' && t.category === b.category)
      .reduce((s, t) => s + t.amount, 0);
    return { ...b, werkelijk };
  });

  const kpis = [
    { label: 'Totaal saldo',       value: saldo,  icon: Wallet,       color: '#0179FE', border: '#0179FE', bg: '#EFF6FF' },
    { label: 'Inkomsten (maand)',   value: inc,    icon: TrendingUp,   color: '#22C55E', border: '#22C55E', bg: '#F0FDF4' },
    { label: 'Uitgaven (maand)',    value: exp,    icon: TrendingDown, color: '#EF4444', border: '#EF4444', bg: '#FEF2F2' },
    { label: 'Netto (maand)',       value: netto,  icon: Activity,
      color: netto >= 0 ? '#22C55E' : '#EF4444',
      border: netto >= 0 ? '#22C55E' : '#EF4444',
      bg:    netto >= 0 ? '#F0FDF4' : '#FEF2F2',
    },
  ];

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>

      {/* ══ Hoofd content ══════════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0, padding: 28 }}>

        {/* Welkomst */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            fontFamily: "'IBM Plex Serif', serif",
            fontSize: 26, fontWeight: 700, color: '#1A1F36',
          }}>
            Welkom terug, {naam}! 👋
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
            Hier is je financieel overzicht van vandaag
          </p>
        </div>

        {/* 4 KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16, marginBottom: 24,
        }}>
          {kpis.map(({ label, value, icon: Icon, color, border, bg }) => (
            <div key={label} className="kpi-card" style={{ borderLeftColor: border }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ fontSize: 10, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {label}
                </p>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} color={color} />
                </div>
              </div>
              <p className="amount" style={{ fontSize: 22, color: loading ? '#D1D5DB' : color }}>
                {loading ? '—' : formatEuro(value)}
              </p>
            </div>
          ))}
        </div>

        {/* Recente transacties */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1F36' }}>
              Recente transacties
            </h3>
            <Link href="/transacties" style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: '#0179FE', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              Alles bekijken <ArrowUpRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                  height: 52, background: '#F3F4F6',
                  borderRadius: 10, animation: 'pulse 1.5s infinite',
                }} />
              ))}
            </div>
          ) : tx.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 36, marginBottom: 10 }}>📊</p>
              <p style={{ fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>Nog geen transacties</p>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>Ga naar Transacties om te beginnen</p>
            </div>
          ) : (
            tx.slice(0, 8).map(t => {
              const stijl = CAT_STYLE[t.category] || CAT_STYLE.default;
              return (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 0', borderBottom: '1px solid #F3F4F6',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: stijl.bg, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {stijl.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description}
                    </p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                      {t.category}
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, marginRight: 8 }}>
                    {formatDatum(t.date)}
                  </p>
                  <p className="amount" style={{
                    fontSize: 13, flexShrink: 0,
                    color: t.type === 'income' ? '#22C55E' : '#EF4444',
                  }}>
                    {t.type === 'income' ? '+' : '-'}{formatEuro(t.amount)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ══ Rechter widget panel ════════════════════════════ */}
      <aside className="right-panel">

        {/* Mijn rekeningen */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>Mijn rekeningen</h3>
            <Link href="/rekeningen" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0179FE', textDecoration: 'none', fontWeight: 600 }}>
              <PlusCircle size={12} /> Toevoegen
            </Link>
          </div>
          {rek.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>Geen rekeningen</p>
          ) : (
            rek.slice(0, 3).map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', borderBottom: '1px solid #F3F4F6',
              }}>
                <div style={{
                  width: 4, height: 36, borderRadius: 2, flexShrink: 0,
                  background: BAR_KLEUR[r.color_gradient] || BAR_KLEUR.blue,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </p>
                  <p style={{ fontSize: 11, color: '#9CA3AF' }}>{r.account_number_masked}</p>
                </div>
                <p className="amount" style={{ fontSize: 13, color: '#1A1F36', flexShrink: 0 }}>
                  {formatEuro(r.balance)}
                </p>
              </div>
            ))
          )}
          <Link href="/rekeningen" style={{ fontSize: 12, color: '#0179FE', textDecoration: 'none', fontWeight: 600, display: 'block', marginTop: 10 }}>
            Alle rekeningen →
          </Link>
        </div>

        {/* Budgetten */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>Budgetten</h3>
            <Link href="/begroting" style={{ fontSize: 12, color: '#0179FE', textDecoration: 'none', fontWeight: 600 }}>
              Beheren →
            </Link>
          </div>
          {budMet.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>Geen budgetten</p>
          ) : (
            budMet.slice(0, 4).map(b => {
              const pct   = b.monthly_limit > 0 ? Math.min(100, (b.werkelijk / b.monthly_limit) * 100) : 0;
              const kleur = pct < 70 ? '#22C55E' : pct < 90 ? '#F59E0B' : '#EF4444';
              return (
                <div key={b.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1F36' }}>{b.category}</span>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>
                      {formatEuro(b.werkelijk)} / {formatEuro(b.monthly_limit)}
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: kleur, borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Schulden */}
        {sch.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>Schulden</h3>
              <Link href="/schulden" style={{ fontSize: 12, color: '#0179FE', textDecoration: 'none', fontWeight: 600 }}>
                Alle schulden →
              </Link>
            </div>
            <p className="amount" style={{ fontSize: 22, color: '#EF4444', marginBottom: 12 }}>
              -{formatEuro(totaalSchuld)}
            </p>
            {sch.slice(0, 3).map(s => {
              const rest = s.oorspronkelijk - s.afgelost;
              const pct  = s.oorspronkelijk > 0 ? (s.afgelost / s.oorspronkelijk) * 100 : 0;
              return (
                <div key={s.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1F36' }}>{s.schuldeiser}</span>
                    <span className="amount" style={{ fontSize: 11, color: '#EF4444' }}>-{formatEuro(rest)}</span>
                  </div>
                  <div style={{ height: 4, background: '#FEE2E2', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: pct + '%', background: '#22C55E', borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Doelen */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>Doelen</h3>
            <Link href="/doelen" style={{ fontSize: 12, color: '#0179FE', textDecoration: 'none', fontWeight: 600 }}>
              Alle doelen →
            </Link>
          </div>
          {doel.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>Geen doelen</p>
          ) : (
            doel.slice(0, 3).map(d => {
              const pct = d.target_amount > 0 ? Math.min(100, (d.current_amount / d.target_amount) * 100) : 0;
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: '#F3F4F6', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    {d.emoji || '🎯'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.name}
                    </p>
                    <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, marginTop: 4 }}>
                      <div style={{ height: '100%', width: pct + '%', background: '#0179FE', borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                      {Math.round(pct)}% — {formatEuro(d.current_amount)} / {formatEuro(d.target_amount)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </aside>
    </div>
  );
}
