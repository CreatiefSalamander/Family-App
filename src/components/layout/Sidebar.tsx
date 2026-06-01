'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import {
  Home, ArrowLeftRight, CreditCard, PieChart,
  TrendingDown, Target, Briefcase, BarChart2,
  Search, MapPin, Settings, LogOut, Euro,
} from 'lucide-react';

interface SidebarProps {
  user: { email: string };
  profiel: { voornaam?: string; achternaam?: string } | null;
}

export default function Sidebar({ user, profiel }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const sb       = createClient();
  const { t }    = useLang();

  const voornaam   = profiel?.voornaam  || '';
  const achternaam = profiel?.achternaam || '';
  const vollnaam   = [voornaam, achternaam].filter(Boolean).join(' ') || user.email.split('@')[0];
  const initialen  = ((voornaam[0] || '') + (achternaam[0] || '') || user.email[0]).toUpperCase();

  const NAV = [
    { label: t.nav.overview,      href: '/home',          icon: Home },
    { label: t.nav.transactions,  href: '/transacties',   icon: ArrowLeftRight },
    { label: t.nav.accounts,      href: '/rekeningen',    icon: CreditCard },
    { label: t.nav.budget,        href: '/begroting',     icon: PieChart },
    { label: t.nav.debts,         href: '/schulden',      icon: TrendingDown },
    { label: t.nav.goals,         href: '/doelen',        icon: Target },
    { label: t.nav.business,      href: '/zakelijk',      icon: Briefcase },
    { label: t.nav.annual,        href: '/jaaroverzicht', icon: BarChart2 },
    { label: t.nav.prices,        href: '/prijsradar',    icon: Search },
    { label: t.nav.location,      href: '/locatie',       icon: MapPin },
    { label: t.nav.settings,      href: '/instellingen',  icon: Settings },
  ];

  async function handleLogout() {
    await sb.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="sidebar">

      {/* ── Logo ─────────────────────────────────────────── */}
      <div>
        <Link href="/home" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 24, textDecoration: 'none',
        }}>
          <div style={{
            width: 34, height: 34, flexShrink: 0,
            background: 'linear-gradient(135deg, #0179FE, #4893FF)',
            borderRadius: 9, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Euro size={18} color="#fff" />
          </div>
          <span className="sidebar-logo">Family-App</span>
        </Link>

        {/* ── Section label ─────────────────────────────── */}
        <p style={{
          fontSize: 10, color: '#4B5563', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: 6, paddingLeft: 12,
        }}>
          MENU
        </p>

        {/* ── Navigation ────────────────────────────────── */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link${active ? ' sidebar-link-active' : ''}`}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 12px', marginBottom: 4,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #0179FE, #4893FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 700,
          }}>
            {initialen}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: '#fff', fontSize: 13, fontWeight: 600,
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
        <button onClick={handleLogout} className="sidebar-link" style={{ marginTop: 2 }}>
          <LogOut size={16} style={{ flexShrink: 0 }} />
          <span>{t.nav.logout}</span>
        </button>
      </div>

    </aside>
  );
}
