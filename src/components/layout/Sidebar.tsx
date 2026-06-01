'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Home, ArrowLeftRight, CreditCard, PieChart,
  TrendingDown, Target, Briefcase, BarChart2,
  Search, MapPin, Settings, LogOut, Euro,
} from 'lucide-react';

interface SidebarProps {
  user: { email: string; id?: string };
  profiel: { voornaam?: string; achternaam?: string } | null;
}

const NAV_ITEMS = [
  { label: 'Overzicht',     href: '/home',          icon: Home },
  { label: 'Transacties',   href: '/transacties',   icon: ArrowLeftRight },
  { label: 'Rekeningen',    href: '/rekeningen',    icon: CreditCard },
  { label: 'Begroting',     href: '/begroting',     icon: PieChart },
  { label: 'Schulden',      href: '/schulden',      icon: TrendingDown },
  { label: 'Doelen',        href: '/doelen',        icon: Target },
  { label: 'Zakelijk',      href: '/zakelijk',      icon: Briefcase },
  { label: 'Jaaroverzicht', href: '/jaaroverzicht', icon: BarChart2 },
  { label: 'Prijsradar',    href: '/prijsradar',    icon: Search },
  { label: 'Locatie',       href: '/locatie',       icon: MapPin },
  { label: 'Instellingen',  href: '/instellingen',  icon: Settings },
];

export default function Sidebar({ user, profiel }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const sb       = createClient();

  const voornaam  = profiel?.voornaam  || '';
  const achternaam = profiel?.achternaam || '';
  const vollnaam  = [voornaam, achternaam].filter(Boolean).join(' ') || user.email.split('@')[0];
  const initialen = (
    (voornaam[0] || '') + (achternaam[0] || '') ||
    user.email[0]
  ).toUpperCase();

  async function handleLogout() {
    await sb.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="sidebar">

      {/* ── Logo ───────────────────────────────────────── */}
      <Link
        href="/home"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 28, textDecoration: 'none',
        }}
      >
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, #0179FE, #4893FF)',
          borderRadius: 9, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Euro size={18} color="#ffffff" />
        </div>
        <span style={{
          fontFamily: "'IBM Plex Serif', serif",
          fontSize: 19, fontWeight: 700, color: '#ffffff',
          letterSpacing: '-0.3px',
        }}>
          Family-App
        </span>
      </Link>

      {/* ── Nav label ──────────────────────────────────── */}
      <p style={{
        fontSize: 10, color: '#4B5563', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        marginBottom: 6, paddingLeft: 12,
      }}>
        MENU
      </p>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,.08)',
        paddingTop: 14, marginTop: 16,
      }}>
        {/* User info */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 10, padding: '6px 12px', marginBottom: 4,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0179FE, #4893FF)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
            color: '#ffffff', fontSize: 13, fontWeight: 700,
          }}>
            {initialen}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: '#ffffff', fontSize: 13, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {vollnaam}
            </p>
            <p style={{
              color: '#6B7280', fontSize: 11,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="nav-item" style={{ marginTop: 2 }}>
          <LogOut size={16} />
          <span>Uitloggen</span>
        </button>
      </div>

    </aside>
  );
}
