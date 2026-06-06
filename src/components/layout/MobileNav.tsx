'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ArrowLeftRight, PieChart, Plus, X,
  MoreHorizontal, Bitcoin, Plane, MapPin,
  Search, Users, Settings, FileText,
  BookOpen, Target, TrendingDown, Briefcase,
  BarChart2, Wallet,
} from 'lucide-react';

/* ── Hoofd navigatie items (altijd zichtbaar) ───────────── */
const MAIN_NAV = [
  { href: '/home',        icon: Home,           label: 'Home'       },
  { href: '/transacties', icon: ArrowLeftRight, label: 'Transacties'},
  { href: '/begroting',   icon: PieChart,       label: 'Begroting'  },
];

/* ── Alle extra pagina's in het Meer-menu ──────────────── */
const MEER_ITEMS = [
  { href: '/rekeningen',    icon: Wallet,      label: 'Rekeningen'   },
  { href: '/schulden',      icon: TrendingDown, label: 'Schulden'    },
  { href: '/doelen',        icon: Target,      label: 'Doelen'       },
  { href: '/zakelijk',      icon: Briefcase,   label: 'Zakelijk'     },
  { href: '/jaaroverzicht', icon: BarChart2,   label: 'Jaaroverzicht'},
  { href: '/kasboek',       icon: BookOpen,    label: 'Kasboek'      },
  { href: '/import',        icon: FileText,    label: 'Import'       },
  { href: '/crypto',        icon: Bitcoin,     label: 'Crypto'       },
  { href: '/reizen',        icon: Plane,       label: 'Reizen'       },
  { href: '/prijsradar',    icon: Search,      label: 'Prijsradar'   },
  { href: '/locatie',       icon: MapPin,      label: 'Locatie'      },
  { href: '/gezin',         icon: Users,       label: 'Gezin'        },
  { href: '/instellingen',  icon: Settings,    label: 'Instellingen' },
];

/* ── Snelle acties in de FAB sheet ─────────────────────── */
const SNEL_ACTIES = [
  { label: 'Transactie', href: '/transacties?nieuw=1', kleur: '#0179FE', bg: '#EFF6FF' },
  { label: 'Kasboek',    href: '/kasboek',             kleur: '#7C3AED', bg: '#F5F3FF' },
  { label: 'Doel',       href: '/doelen',              kleur: '#16A34A', bg: '#F0FDF4' },
  { label: 'Import',     href: '/import',              kleur: '#D97706', bg: '#FFFBEB' },
];

/* ── Kleurconstanten ────────────────────────────────────── */
const BLAUW = '#0179FE';
const GRIJS = '#9CA3AF';

export default function MobileNav() {
  const path = usePathname();
  const [fabOpen,  setFabOpen]  = useState(false);
  const [meerOpen, setMeerOpen] = useState(false);

  const sluitAlles = () => { setFabOpen(false); setMeerOpen(false); };

  return (
    <>
      {/* ── Dimoverlay ───────────────────────────────────── */}
      {(fabOpen || meerOpen) && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.5)',
            zIndex: 48,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={sluitAlles}
        />
      )}

      {/* ── FAB snelle acties sheet — wit ────────────────── */}
      {fabOpen && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: 16, right: 16,
          background: '#FFFFFF',
          borderRadius: 20,
          padding: 20,
          zIndex: 49,
          boxShadow: '0 -4px 32px rgba(0,0,0,.15)',
          animation: 'sheetUp .25s cubic-bezier(.16,1,.3,1)',
        }}>
          {/* Handle balk */}
          <div style={{
            width: 36, height: 4,
            background: '#E5E7EB',
            borderRadius: 2,
            margin: '0 auto 16px',
          }} />
          <p style={{
            fontSize: 11, fontWeight: 700,
            color: '#9CA3AF', letterSpacing: '.1em',
            textTransform: 'uppercase',
            textAlign: 'center', marginBottom: 16,
          }}>
            SNELLE ACTIE
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}>
            {SNEL_ACTIES.map(a => (
              <Link
                key={a.label}
                href={a.href}
                onClick={sluitAlles}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    width: 52, height: 52,
                    borderRadius: 16,
                    background: a.bg,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${a.kleur}22`,
                  }}>
                    <Plus size={22} color={a.kleur} />
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: '#6B7280', textAlign: 'center',
                  }}>
                    {a.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Meer-menu sheet — wit, onderaan scherm ───────── */}
      {meerOpen && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: 0, right: 0,
          background: '#FFFFFF',
          borderRadius: '20px 20px 0 0',
          padding: '16px 16px 24px',
          zIndex: 49,
          boxShadow: '0 -4px 32px rgba(0,0,0,.15)',
          maxHeight: '70vh',
          overflowY: 'auto',
          animation: 'sheetUp .25s cubic-bezier(.16,1,.3,1)',
        }}>
          <div style={{
            width: 36, height: 4,
            background: '#E5E7EB',
            borderRadius: 2,
            margin: '0 auto 20px',
          }} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}>
            {MEER_ITEMS.map(item => {
              const actief = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={sluitAlles}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 6,
                    padding: '12px 4px',
                    borderRadius: 12,
                    background: actief
                      ? 'linear-gradient(135deg,#0179FE,#4893FF)'
                      : '#F5F7FA',
                  }}>
                    <item.icon
                      size={20}
                      color={actief ? '#fff' : '#6B7280'}
                      strokeWidth={actief ? 2.5 : 1.8}
                    />
                    <span style={{
                      fontSize: 10, fontWeight: actief ? 700 : 600,
                      color: actief ? '#fff' : '#6B7280',
                      textAlign: 'center', lineHeight: 1.2,
                    }}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom nav bar — Dyme stijl (wit, geen pill) ─── */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: '#FFFFFF',
          borderTop: '1px solid #F0F0F0',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          paddingTop: 8,
          boxShadow: '0 -2px 12px rgba(0,0,0,.06)',
        }}
      >
        {/* Hoofd navigatie items */}
        {MAIN_NAV.map(({ href, icon: Icon, label }) => {
          const actief = path === href || path.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '4px 2px',
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
                minHeight: 52,
              }}
            >
              <Icon
                size={22}
                color={actief ? BLAUW : GRIJS}
                strokeWidth={actief ? 2.5 : 1.8}
              />
              <span style={{
                fontSize: 10,
                fontWeight: actief ? 700 : 500,
                color: actief ? BLAUW : GRIJS,
                fontFamily: "'Inter', sans-serif",
              }}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* FAB knop — blauw vierkant */}
        <button
          onClick={() => { setFabOpen(!fabOpen); setMeerOpen(false); }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            minHeight: 52,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{
            width: 44, height: 44,
            borderRadius: 14,
            background: fabOpen
              ? '#EF4444'
              : 'linear-gradient(135deg,#0179FE,#4893FF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(1,121,254,.35)',
            transition: 'background .2s',
          }}>
            {fabOpen
              ? <X size={20} color="#fff" strokeWidth={2.5}/>
              : <Plus size={22} color="#fff" strokeWidth={2.5}/>
            }
          </div>
        </button>

        {/* Meer knop */}
        <button
          onClick={() => { setMeerOpen(!meerOpen); setFabOpen(false); }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            minHeight: 52,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <MoreHorizontal
            size={22}
            color={meerOpen ? BLAUW : GRIJS}
            strokeWidth={meerOpen ? 2.5 : 1.8}
          />
          <span style={{
            fontSize: 10,
            fontWeight: meerOpen ? 700 : 500,
            color: meerOpen ? BLAUW : GRIJS,
            fontFamily: "'Inter', sans-serif",
          }}>
            Meer
          </span>
        </button>
      </nav>

      {/* Sheet animatie */}
      <style>{`
        @keyframes sheetUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
