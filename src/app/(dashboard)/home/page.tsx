'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { getGreeting } from '@/lib/translations';
import {
  Wallet, TrendingUp, TrendingDown, Activity,
  PlusCircle, ArrowRight, ChevronRight,
} from 'lucide-react';
import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import BankCard from '@/components/ui/BankCard';
import MerchantLogo from '@/components/finance/MerchantLogo';
import type { Transactie, Rekening, Budget, Schuld, Doel } from '@/types';

/* ── Helpers ─────────────────────────────────────────────── */
const fmtEuro = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

const CAT_EMOJI: Record<string, string> = {
  Boodschappen: '🛒', Eten: '🍔', Transport: '🚗', Wonen: '🏠',
  Gezondheid: '💊', Salaris: '💰', Inkomen: '💰', Zakelijk: '💼',
  Abonnement: '📱', Kleding: '👕', Sport: '🏋️', Overig: '📄',
};

export default function HomePage() {
  const { t, lang }   = useLang();
  const [tx,    setTx]   = useState<Transactie[]>([]);
  const [rek,   setRek]  = useState<Rekening[]>([]);
  const [bud,   setBud]  = useState<Budget[]>([]);
  const [sch,   setSch]  = useState<Schuld[]>([]);
  const [doel,  setDoel] = useState<Doel[]>([]);
  const [naam,     setNaam]    = useState('');
  const [vollnaam, setVollnaam] = useState('');
  const [email,    setEmail]   = useState('');
  const [loading,  setLoad]    = useState(true);
  const sb = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');
      const [a, b, c, d, e, f] = await Promise.all([
        sb.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
        sb.from('accounts').select('*').eq('user_id', user.id),
        sb.from('budgets').select('*').eq('user_id', user.id),
        sb.from('schulden').select('*').eq('user_id', user.id),
        sb.from('goals').select('*').eq('user_id', user.id),
        sb.from('profielen').select('voornaam, achternaam').eq('id', user.id).single(),
      ]);
      setTx(  (a.data || []) as unknown as Transactie[]);
      setRek( (b.data || []) as unknown as Rekening[]);
      setBud( (c.data || []) as unknown as Budget[]);
      setSch( (d.data || []) as unknown as Schuld[]);
      setDoel((e.data || []) as unknown as Doel[]);
      if (f.data?.voornaam) {
        setNaam(f.data.voornaam);
        setVollnaam([f.data.voornaam, f.data.achternaam].filter(Boolean).join(' '));
      }
      setLoad(false);
    })();
  }, []);

  /* ── Berekeningen ─────────────────────────────────────── */
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

  /* ── Gezondheidscore ─────────────────────────────────── */
  const budgetScore = bud.length > 0
    ? Math.round((budMet.filter(b => b.werkelijk <= b.monthly_limit).length / bud.length) * 30)
    : 15;
  const spaarpct    = inc > 0 ? Math.min(25, Math.round((netto / inc) * 25)) : 0;
  const nettoScore  = netto > 0 ? 20 : 0;
  const schuldScore = sch.length > 0
    ? Math.round(Math.min(25, (sch.reduce((s,d)=>s+d.afgelost,0)/Math.max(1,sch.reduce((s,d)=>s+d.oorspronkelijk,0)))*25))
    : 25;
  const score = Math.max(0, Math.min(100, budgetScore + spaarpct + nettoScore + schuldScore));
  const [scoreKleur, scoreLabel] = score >= 71 ? ['#22C55E','Goed'] : score >= 41 ? ['#F59E0B','Matig'] : ['#EF4444','Kritiek'];

  const greeting = getGreeting(lang, now.getHours());
  const todayStr = now.toLocaleDateString(
    lang === 'ar' ? 'ar-SA' : lang === 'hy' ? 'hy-AM' : lang === 'en' ? 'en-GB' : 'nl-NL',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  );

  const kpis = [
    { label: t.dashboard.total_balance,  value: saldo, icon: Wallet,       color: '#0179FE', bg: '#EFF6FF' },
    { label: t.dashboard.month_income,   value: inc,   icon: TrendingUp,   color: '#22C55E', bg: '#F0FDF4' },
    { label: t.dashboard.month_expenses, value: exp,   icon: TrendingDown, color: '#EF4444', bg: '#FEF2F2' },
    { label: t.dashboard.month_net,      value: netto, icon: Activity,
      color: netto >= 0 ? '#22C55E' : '#EF4444',
      bg:    netto >= 0 ? '#F0FDF4' : '#FEF2F2',
    },
  ];

  return (
    <section className="home">

      {/* ══ Hoofd content ═══════════════════════════════════ */}
      <div className="home-content no-scrollbar">

        {/* ── Desktop header ─────────────────────────────── */}
        <div className="header-box" style={{ marginBottom: 24 }}>
          <h1 className="header-box-title">{greeting}, {naam}! 👋</h1>
          <p className="header-box-subtext">{todayStr}</p>
        </div>

        {/* ── Mobiel: Dyme begroeting ───────────────────── */}
        <div className="dyme-greeting" style={{ padding: '8px 16px 0' }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 2 }}>{todayStr}</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1F36', lineHeight: 1.2 }}>
            Hoi {naam || 'daar'}! 👋
          </h1>
        </div>

        {/* ── TotalBalanceBox ────────────────────────────── */}
        <div className="float-section">
          <TotalBalanceBox rekeningen={rek} totaalSaldo={saldo} loading={loading} />
        </div>

        {/* ── Gezondheidscore — drijvende widget ─────────── */}
        {!loading && (
          <div className="float-section">
            <div className="float-card" style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
            }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
                <circle cx="32" cy="32" r="26" fill="none" stroke="#F3F4F6" strokeWidth="6" />
                <circle cx="32" cy="32" r="26" fill="none" stroke={scoreKleur} strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`}
                  strokeLinecap="round" transform="rotate(-90 32 32)"
                  style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                />
                <text x="32" y="37" textAnchor="middle" fill={scoreKleur} fontSize="14" fontWeight="800">{score}</text>
              </svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  Financiële gezondheid
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: scoreKleur, marginTop: 2 }}>{scoreLabel}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  Budget {budgetScore}/30 · Sparen {spaarpct}/25 · Schulden {schuldScore}/25
                </p>
              </div>
              <Link href="/begroting" style={{ textDecoration: 'none', flexShrink: 0 }}>
                <ChevronRight size={20} color="#D1D5DB" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Rekeningen — horizontale scroll kaarten ───── */}
        {rek.length > 0 && (
          <div className="float-section">
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 12,
            }}>
              <h2 className="section-title">Rekeningen</h2>
              <Link href="/rekeningen" style={{
                fontSize: 13, color: '#0179FE', fontWeight: 600,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                Alles <ArrowRight size={14} />
              </Link>
            </div>
            {/* Horizontale scroll */}
            <div className="h-scroll">
              {rek.map(r => (
                <div key={r.id} className="h-scroll-item" style={{ width: 280 }}>
                  <BankCard rekening={r} naam={naam} showBalance />
                </div>
              ))}
              {/* Voeg rekening toe knop */}
              <Link href="/rekeningen" className="h-scroll-item" style={{
                width: 120, textDecoration: 'none',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8, background: '#F9FAFB',
                border: '2px dashed #E5E7EB',
                borderRadius: 16,
              }}>
                <PlusCircle size={24} color="#9CA3AF" />
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Toevoegen</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── 4 KPI Widgets — 2×2 grid ─────────────────── */}
        <div className="float-section">
          <h2 className="section-title" style={{ marginBottom: 12 }}>Deze maand</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: 10,
          }}>
            {kpis.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="float-kpi"
                style={{ borderTopColor: color }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <Icon size={18} color={color} />
                </div>
                <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {label}
                </p>
                <p className="amount" style={{
                  fontSize: loading ? 14 : 16,
                  color: loading ? '#D1D5DB' : color,
                  fontWeight: 800,
                }}>
                  {loading ? '—' : fmtEuro(value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Budgetten — voortgangsbalken ─────────────── */}
        {budMet.length > 0 && (
          <div className="float-section">
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 14,
            }}>
              <h2 className="section-title">Budgetten</h2>
              <Link href="/begroting" style={{ fontSize: 13, color: '#0179FE', fontWeight: 600, textDecoration: 'none' }}>
                Beheer →
              </Link>
            </div>
            <div className="float-card" style={{ padding: '4px 16px 8px' }}>
              {budMet.slice(0, 4).map((b, i) => {
                const pct   = b.monthly_limit > 0 ? Math.min(100, (b.werkelijk / b.monthly_limit) * 100) : 0;
                const kleur = pct < 70 ? '#22C55E' : pct < 90 ? '#F59E0B' : '#EF4444';
                return (
                  <div key={b.id} style={{
                    padding: '12px 0',
                    borderBottom: i < Math.min(budMet.length, 4) - 1 ? '1px solid #F3F4F6' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36' }}>
                        {CAT_EMOJI[b.category] || '📁'} {b.category}
                      </span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>
                        {fmtEuro(b.werkelijk)} / {fmtEuro(b.monthly_limit)}
                      </span>
                    </div>
                    <div style={{
                      height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: pct + '%',
                        background: kleur, borderRadius: 3,
                        transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Doelen — horizontale scroll ──────────────── */}
        {doel.length > 0 && (
          <div className="float-section">
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 12,
            }}>
              <h2 className="section-title">Spaardoelen</h2>
              <Link href="/doelen" style={{ fontSize: 13, color: '#0179FE', fontWeight: 600, textDecoration: 'none' }}>
                Alles <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </Link>
            </div>
            <div className="h-scroll">
              {doel.slice(0, 5).map(d => {
                const pct = d.target_amount > 0 ? Math.min(100, (d.current_amount / d.target_amount) * 100) : 0;
                return (
                  <Link key={d.id} href="/doelen" className="h-scroll-item" style={{
                    width: 160, textDecoration: 'none',
                    background: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: '0 2px 12px rgba(0,0,0,.08)',
                    border: '1px solid #F0F0F0',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{d.emoji || '🎯'}</div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.name}
                    </p>
                    <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, marginBottom: 6 }}>
                      <div style={{ height: '100%', width: pct + '%', background: '#0179FE', borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: 10, color: '#9CA3AF' }}>{Math.round(pct)}%</p>
                    <p className="amount" style={{ fontSize: 13, color: '#0179FE', marginTop: 2 }}>
                      {fmtEuro(d.current_amount)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Recente transacties ───────────────────────── */}
        <div className="float-section" style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 12,
          }}>
            <h2 className="section-title">{t.dashboard.recent_transactions}</h2>
            <Link href="/transacties" style={{ fontSize: 13, color: '#0179FE', fontWeight: 600, textDecoration: 'none' }}>
              {t.dashboard.view_all} →
            </Link>
          </div>

          <div className="float-card" style={{ padding: '0 0 4px' }}>
            {loading ? (
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 48, borderRadius: 10 }} />
                ))}
              </div>
            ) : tx.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: 40, marginBottom: 8 }}>📊</p>
                <p style={{ fontWeight: 600, color: '#4B5563' }}>{t.dashboard.no_transactions}</p>
                <Link href="/transacties">
                  <button className="btn-primary" style={{ marginTop: 16 }}>
                    + {t.transactions.add}
                  </button>
                </Link>
              </div>
            ) : (
              tx.slice(0, 8).map((t, i) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < Math.min(tx.length, 8) - 1 ? '1px solid #F9FAFB' : 'none',
                }}>
                  <MerchantLogo naam={t.tegenpartij || t.description} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description}
                    </p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      {CAT_EMOJI[t.category] || '📄'} {t.category} · {fmtDate(t.date)}
                    </p>
                  </div>
                  <p className="amount" style={{
                    fontSize: 13, flexShrink: 0,
                    color: t.type === 'income' ? '#22C55E' : '#1A1F36',
                    fontWeight: 700,
                  }}>
                    {t.type === 'income' ? '+' : '-'}{fmtEuro(t.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>{/* .home-content */}

      {/* ══ Right sidebar — desktop ═══════════════════════ */}
      <aside className="right-sidebar no-scrollbar">

        {/* Profiel */}
        <section style={{ display: 'flex', flexDirection: 'column', paddingBottom: 24 }}>
          <div className="profile-banner" />
          <div className="profile">
            <div className="profile-img">
              <span style={{ fontSize: 32, fontWeight: 700, color: '#0179FE', lineHeight: 1 }}>
                {naam[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div className="profile-details">
              <h1 className="profile-name">{vollnaam || naam}</h1>
              <p className="profile-email">{email}</p>
            </div>
          </div>
        </section>

        {/* Rekeningen rechts sidebar */}
        <section style={{ paddingTop: 24, paddingBottom: 24, borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1F36' }}>{t.dashboard.my_accounts}</h2>
            <Link href="/rekeningen" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', textDecoration: 'none', fontWeight: 600 }}>
              <PlusCircle size={14} /> {t.dashboard.add_account}
            </Link>
          </div>
          {rek.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>{t.dashboard.no_accounts}</p>
          ) : (
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
                <BankCard rekening={rek[0]} naam={naam} showBalance={false} />
              </div>
              {rek[1] && (
                <div style={{ position: 'absolute', top: 24, right: 0, zIndex: 0, width: '90%' }}>
                  <BankCard rekening={rek[1]} naam={naam} showBalance={false} />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Budgetten rechts */}
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
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: pct + '%', background: kleur }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Schulden rechts */}
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

        {/* Doelen rechts */}
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
