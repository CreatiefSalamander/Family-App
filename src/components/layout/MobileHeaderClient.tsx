'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  X, Home, ArrowLeftRight, CreditCard, PieChart,
  TrendingDown, Target, Briefcase, BarChart2,
  Search, MapPin, Settings, LogOut, Upload,
  Bitcoin, Plane, Wallet, Users, RefreshCw, Euro,
} from 'lucide-react';

/* ── Navigatie groepen (identiek aan Sidebar) ──────────────── */
const GROEPEN = [
  {
    label: 'Financiën',
    kleur: '#0179FE',
    items: [
      { label: 'Overzicht',   href: '/home',          icon: Home         },
      { label: 'Transacties', href: '/transacties',   icon: ArrowLeftRight },
      { label: 'Rekeningen',  href: '/rekeningen',    icon: CreditCard   },
      { label: 'Begroting',   href: '/begroting',     icon: PieChart     },
      { label: 'Kasboek',     href: '/kasboek',       icon: Wallet       },
    ],
  },
  {
    label: 'Verplichtingen',
    kleur: '#EF4444',
    items: [
      { label: 'Schulden', href: '/schulden', icon: TrendingDown },
      { label: 'Doelen',   href: '/doelen',   icon: Target       },
    ],
  },
  {
    label: 'Zakelijk',
    kleur: '#7C3AED',
    items: [
      { label: 'Zakelijk',      href: '/zakelijk',      icon: Briefcase  },
      { label: 'Jaaroverzicht', href: '/jaaroverzicht', icon: BarChart2  },
      { label: 'Crypto',        href: '/crypto',        icon: Bitcoin    },
    ],
  },
  {
    label: 'Leven',
    kleur: '#16A34A',
    items: [
      { label: 'Reizen',     href: '/reizen',     icon: Plane   },
      { label: 'Prijsradar', href: '/prijsradar', icon: Search  },
      { label: 'Locatie',    href: '/locatie',    icon: MapPin  },
      { label: 'Gezin',      href: '/gezin',      icon: Users   },
    ],
  },
  {
    label: 'Beheer',
    kleur: '#F59E0B',
    items: [
      { label: 'Import',       href: '/import',       icon: Upload   },
      { label: 'Instellingen', href: '/instellingen', icon: Settings },
    ],
  },
];

interface Props {
  initialen: string;
  voornaam:  string;
  email:     string;
}

export default function MobileHeaderClient({ initialen, voornaam, email }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const sb       = createClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  /* ── Sluit drawer bij route wissel ─────────────────────── */
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  /* ── Swipe-to-close: detecteer links swipe op drawer ───── */
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    let startX = 0;
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onTouchEnd   = (e: TouchEvent) => {
      if (startX - e.changedTouches[0].clientX > 60) setDrawerOpen(false);
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [drawerOpen]);

  /* ── Voorkom body scroll als drawer open ───────────────── */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  async function handleLogout() {
    await sb.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* ── Mobiele header bar ─────────────────────────────── */}
      <header className="mobile-header" style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #F0F0F0',
        height: 60,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 55,
        boxShadow: '0 1px 8px rgba(0,0,0,.06)',
      }}>
        {/* Hamburger — opent drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 8,
            display: 'flex', flexDirection: 'column', gap: 5,
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Menu openen"
        >
          <div style={{ width: 22, height: 2, background: '#1A1F36', borderRadius: 2 }} />
          <div style={{ width: 22, height: 2, background: '#1A1F36', borderRadius: 2 }} />
          <div style={{ width: 16, height: 2, background: '#1A1F36', borderRadius: 2 }} />
        </button>

        {/* App naam */}
        <span style={{
          fontFamily: "'IBM Plex Serif', serif",
          fontSize: 18, fontWeight: 700, color: '#1A1F36',
        }}>
          Household
        </span>

        {/* Rechts: refresh + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, display: 'flex', alignItems: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Vernieuwen"
          >
            <RefreshCw size={20} color="#9CA3AF" />
          </button>
          <Link href="/instellingen" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#0179FE,#4893FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {initialen || '?'}
            </div>
          </Link>
        </div>
      </header>

      {/* ── Overlay ───────────────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 59,
          }}
        />
      )}

      {/* ── Slide-in drawer ───────────────────────────────── */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 300,
          background: '#FFFFFF',
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,.18)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .3s cubic-bezier(.16,1,.3,1)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 16px 16px',
          borderBottom: '1px solid #F3F4F6',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg,#0179FE,#4893FF)',
              borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Euro size={18} color="#fff" />
            </div>
            <span style={{
              fontFamily: "'IBM Plex Serif', serif",
              fontSize: 18, fontWeight: 700, color: '#1A1F36',
            }}>
              Household
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              background: '#F3F4F6', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
            aria-label="Sluiten"
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Navigatie groepen */}
        <nav style={{ flex: 1, padding: '12px 12px 0', overflowY: 'auto' }}>
          {GROEPEN.map(groep => (
            <div key={groep.label} style={{ marginBottom: 4 }}>
              {/* Sectie label */}
              <p style={{
                fontSize: 10, fontWeight: 800,
                color: '#9CA3AF',
                letterSpacing: '.12em', textTransform: 'uppercase',
                padding: '10px 12px 6px',
              }}>
                {groep.label}
              </p>
              {groep.items.map(({ label, href, icon: Icon }) => {
                const actief = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 12px',
                      borderRadius: 10,
                      marginBottom: 2,
                      background: actief
                        ? 'linear-gradient(135deg,#0179FE,#4893FF)'
                        : 'transparent',
                      transition: 'background .15s',
                    }}>
                      <Icon
                        size={18}
                        color={actief ? '#fff' : '#6B7280'}
                        strokeWidth={actief ? 2.5 : 1.8}
                      />
                      <span style={{
                        fontSize: 14, fontWeight: actief ? 600 : 500,
                        color: actief ? '#fff' : '#374151',
                      }}>
                        {label}
                      </span>
                      {actief && (
                        <div style={{
                          marginLeft: 'auto',
                          width: 6, height: 6,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,.7)',
                        }} />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Gebruiker + logout onderaan */}
        <div style={{
          borderTop: '1px solid #F3F4F6',
          padding: '16px 16px 32px',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px',
            background: '#F9FAFB',
            borderRadius: 12,
            marginBottom: 8,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#0179FE,#4893FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
            }}>
              {initialen || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 600, color: '#1A1F36',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {voornaam || email.split('@')[0]}
              </p>
              <p style={{
                fontSize: 11, color: '#9CA3AF',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', background: 'none', border: '1.5px solid #E5E7EB',
              borderRadius: 10, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', color: '#EF4444', fontWeight: 600, fontSize: 14,
            }}
          >
            <LogOut size={16} />
            Uitloggen
          </button>
        </div>
      </div>
    </>
  );
}
