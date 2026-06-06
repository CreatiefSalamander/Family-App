'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ArrowLeftRight, PieChart, Plus, X,
  MoreHorizontal, Bitcoin, Plane, MapPin,
  Search, Users, Settings, FileText,
  BookOpen, Target, TrendingDown, Briefcase,
  BarChart2, Wallet, CreditCard,
} from 'lucide-react';

/* ── Hoofd navigatie items (altijd zichtbaar) ───────────── */
const MAIN_NAV = [
  { href: '/home',        icon: Home,           label: 'Home'       },
  { href: '/transacties', icon: ArrowLeftRight, label: 'Transacties'},
  { href: '/begroting',   icon: PieChart,       label: 'Begroting'  },
];

/* ── Snelle acties in de FAB sheet ─────────────────────── */
const SNEL_ACTIES = [
  { label: 'Transactie',  href: '/transacties?nieuw=1', icon: Plus,          kleur: '#0179FE', bg: '#EFF6FF'  },
  { label: 'Kasboek',     href: '/kasboek',             icon: BookOpen,      kleur: '#7C3AED', bg: '#F5F3FF'  },
  { label: 'Spaardoel',   href: '/doelen',              icon: Target,        kleur: '#16A34A', bg: '#F0FDF4'  },
  { label: 'Import',      href: '/import',              icon: FileText,      kleur: '#D97706', bg: '#FFFBEB'  },
];

/* ── Meer-menu: logisch gegroepeerd in 2 secties ─────────── */
const MEER_GROEPEN = [
  {
    label: 'Accounts & Geld',
    items: [
      { href: '/rekeningen',    icon: CreditCard,  label: 'Rekeningen'    },
      { href: '/schulden',      icon: TrendingDown, label: 'Schulden'     },
      { href: '/doelen',        icon: Target,      label: 'Spaardoelen'   },
      { href: '/zakelijk',      icon: Briefcase,   label: 'Zakelijk'      },
    ],
  },
  {
    label: 'Overzichten',
    items: [
      { href: '/jaaroverzicht', icon: BarChart2,   label: 'Jaaroverzicht' },
      { href: '/kasboek',       icon: BookOpen,    label: 'Kasboek'       },
      { href: '/crypto',        icon: Bitcoin,     label: 'Crypto'        },
      { href: '/import',        icon: FileText,    label: 'Import'        },
    ],
  },
  {
    label: 'Leven & Beheer',
    items: [
      { href: '/reizen',        icon: Plane,       label: 'Reizen'        },
      { href: '/prijsradar',    icon: Search,      label: 'Prijsradar'    },
      { href: '/locatie',       icon: MapPin,      label: 'Locatie'       },
      { href: '/gezin',         icon: Users,       label: 'Gezin'         },
      { href: '/instellingen',  icon: Settings,    label: 'Instellingen'  },
    ],
  },
];

/* ── Kleuren ─────────────────────────────────────────────── */
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
            background: 'rgba(0,0,0,.45)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 48,
          }}
          onClick={sluitAlles}
        />
      )}

      {/* ── FAB snelle acties sheet ──────────────────────── */}
      {fabOpen && (
        <div style={{
          position: 'fixed',
          bottom: 76,
          left: 12, right: 12,
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '16px 20px 20px',
          zIndex: 49,
          boxShadow: '0 -4px 32px rgba(0,0,0,.15)',
          animation: 'sheetUp .3s cubic-bezier(.16,1,.3,1)',
        }}>
          <div style={{
            width: 40, height: 4, background: '#E5E7EB',
            borderRadius: 2, margin: '0 auto 16px',
          }} />
          <p style={{
            fontSize: 11, fontWeight: 800, color: '#9CA3AF',
            letterSpacing: '.12em', textTransform: 'uppercase',
            marginBottom: 16, textAlign: 'center',
          }}>
            Snel toevoegen
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10,
          }}>
            {SNEL_ACTIES.map(a => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.label} href={a.href} onClick={sluitAlles}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 6,
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 18,
                      background: a.bg, border: `1.5px solid ${a.kleur}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 4px 12px ${a.kleur}22`,
                    }}>
                      <Icon size={22} color={a.kleur} />
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#6B7280',
                      textAlign: 'center', lineHeight: 1.2,
                    }}>
                      {a.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Meer-menu: gegroepeerde sheet ────────────────── */}
      {meerOpen && (
        <div style={{
          position: 'fixed',
          bottom: 76,
          left: 0, right: 0,
          background: '#FFFFFF',
          borderRadius: '24px 24px 0 0',
          padding: '0 0 16px',
          zIndex: 49,
          boxShadow: '0 -4px 40px rgba(0,0,0,.18)',
          maxHeight: '75vh',
          overflowY: 'auto',
          animation: 'sheetUp .3s cubic-bezier(.16,1,.3,1)',
        }}>
          {/* Handle balk */}
          <div style={{
            width: 40, height: 4, background: '#E5E7EB',
            borderRadius: 2, margin: '12px auto 16px',
            flexShrink: 0,
          }} />

          {MEER_GROEPEN.map(groep => (
            <div key={groep.label} style={{ marginBottom: 4 }}>
              {/* Sectie header */}
              <p style={{
                fontSize: 10, fontWeight: 800, color: '#9CA3AF',
                letterSpacing: '.12em', textTransform: 'uppercase',
                padding: '4px 20px 8px',
              }}>
                {groep.label}
              </p>
              {/* Items als rijen */}
              <div style={{ padding: '0 12px' }}>
                {groep.items.map(item => {
                  const actief = path === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href} href={item.href} onClick={sluitAlles}
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 12px',
                        borderRadius: 12,
                        background: actief ? 'linear-gradient(135deg,#0179FE,#4893FF)' : 'transparent',
                        marginBottom: 2,
                        transition: 'background .15s',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: actief ? 'rgba(255,255,255,.2)' : '#F5F7FA',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon
                            size={18}
                            color={actief ? '#fff' : '#6B7280'}
                            strokeWidth={actief ? 2.5 : 1.8}
                          />
                        </div>
                        <span style={{
                          fontSize: 14, fontWeight: actief ? 600 : 500,
                          color: actief ? '#fff' : '#374151',
                        }}>
                          {item.label}
                        </span>
                        {actief && (
                          <div style={{
                            marginLeft: 'auto',
                            width: 8, height: 8, borderRadius: '50%',
                            background: 'rgba(255,255,255,.8)',
                          }} />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Scheidingslijn tussen groepen */}
              <div style={{
                height: 1, background: '#F3F4F6',
                margin: '8px 20px',
              }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom nav bar ───────────────────────────────── */}
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
          height: 72,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -2px 12px rgba(0,0,0,.06)',
        }}
      >
        {/* Hoofd nav items */}
        {MAIN_NAV.map(({ href, icon: Icon, label }) => {
          const actief = path === href || path.startsWith(href + '/');
          return (
            <Link
              key={href} href={href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '4px 2px', textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent', minHeight: 52,
              }}
            >
              <Icon
                size={22}
                color={actief ? BLAUW : GRIJS}
                strokeWidth={actief ? 2.5 : 1.8}
              />
              <span style={{
                fontSize: 10, fontWeight: actief ? 700 : 500,
                color: actief ? BLAUW : GRIJS,
                fontFamily: "'Inter', sans-serif",
              }}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* FAB — blauw, midden */}
        <button
          onClick={() => { setFabOpen(!fabOpen); setMeerOpen(false); }}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3, minHeight: 52, border: 'none',
            background: 'transparent', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: fabOpen
              ? '#EF4444'
              : 'linear-gradient(135deg,#0179FE,#4893FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 16px ${fabOpen ? 'rgba(239,68,68,.4)' : 'rgba(1,121,254,.4)'}`,
            transition: 'background .2s, box-shadow .2s',
            transform: fabOpen ? 'rotate(45deg)' : 'rotate(0)',
          }}>
            <Plus size={24} color="#fff" strokeWidth={2.5} />
          </div>
        </button>

        {/* Meer knop */}
        <button
          onClick={() => { setMeerOpen(!meerOpen); setFabOpen(false); }}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3, minHeight: 52, border: 'none',
            background: 'transparent', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <MoreHorizontal
            size={22}
            color={meerOpen ? BLAUW : GRIJS}
            strokeWidth={meerOpen ? 2.5 : 1.8}
          />
          <span style={{
            fontSize: 10, fontWeight: meerOpen ? 700 : 500,
            color: meerOpen ? BLAUW : GRIJS,
            fontFamily: "'Inter', sans-serif",
          }}>
            Meer
          </span>
        </button>
      </nav>

      {/* Animatie keyframes */}
      <style>{`
        @keyframes sheetUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
