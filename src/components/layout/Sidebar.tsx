'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/lang-context';
import { useEffect, useState } from 'react';
import {
  Home, ArrowLeftRight, CreditCard, PieChart,
  TrendingDown, Target, Briefcase, BarChart2,
  Search, MapPin, Settings, LogOut, Upload,
  Bitcoin, Plane, ChevronLeft, ChevronRight,
  Euro, Wallet, Users,
} from 'lucide-react';

interface SidebarProps {
  user: { email: string };
  profiel: { voornaam?: string; achternaam?: string } | null;
}

const GROEPEN = [
  {
    label: 'FINANCIËN',
    items: [
      { label: 'Overzicht',     href: '/home',          icon: Home,           tip: 'Financieel overzicht' },
      { label: 'Transacties',   href: '/transacties',   icon: ArrowLeftRight, tip: 'Inkomsten & uitgaven' },
      { label: 'Rekeningen',    href: '/rekeningen',    icon: CreditCard,     tip: 'Bankrekeningen' },
      { label: 'Begroting',     href: '/begroting',     icon: PieChart,       tip: 'Maandbudgetten' },
      { label: 'Kasboek',       href: '/kasboek',       icon: Wallet,         tip: 'Snel cash bijhouden (offline)' },
    ],
  },
  {
    label: 'VERPLICHTINGEN',
    items: [
      { label: 'Schulden',      href: '/schulden',      icon: TrendingDown,   tip: 'Schulden & aflossingen' },
      { label: 'Doelen',        href: '/doelen',        icon: Target,         tip: 'Spaardoelen' },
    ],
  },
  {
    label: 'ZAKELIJK',
    items: [
      { label: 'Zakelijk',      href: '/zakelijk',      icon: Briefcase,      tip: 'Zakelijk overzicht + BTW' },
      { label: 'Jaaroverzicht', href: '/jaaroverzicht', icon: BarChart2,      tip: 'Jaarlijks financieel rapport' },
      { label: 'Crypto',        href: '/crypto',        icon: Bitcoin,        tip: 'Bitvavo portfolio' },
    ],
  },
  {
    label: 'LEVEN',
    items: [
      { label: 'Reizen',        href: '/reizen',        icon: Plane,          tip: 'Vluchten & reisplanning' },
      { label: 'Prijsradar',    href: '/prijsradar',    icon: Search,         tip: 'Prijsvergelijker' },
      { label: 'Locatie',       href: '/locatie',       icon: MapPin,         tip: 'Koersen, winkels & weer' },
      { label: 'Gezin',         href: '/gezin',         icon: Users,          tip: 'Partner & gezin koppelen' },
    ],
  },
  {
    label: 'BEHEER',
    items: [
      { label: 'Importeer',     href: '/import',        icon: Upload,         tip: 'CSV / Excel / PDF import' },
      { label: 'Instellingen',  href: '/instellingen',  icon: Settings,       tip: 'Profiel, taal & koppelingen' },
    ],
  },
];

export default function Sidebar({ user, profiel }: SidebarProps) {
  const pathname   = usePathname();
  const router     = useRouter();
  const sb         = createClient();
  const { t }      = useLang();
  const [collapsed, setCollapsed] = useState(false);

  const voornaam   = profiel?.voornaam  || '';
  const achternaam = profiel?.achternaam || '';
  const vollnaam   = [voornaam, achternaam].filter(Boolean).join(' ') || user.email.split('@')[0];
  const initialen  = ((voornaam[0] || '') + (achternaam[0] || '') || user.email[0]).toUpperCase();

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed') === 'true';
    setCollapsed(saved);
    document.body.dataset.sidebar = saved ? 'collapsed' : 'open';
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
    document.body.dataset.sidebar = next ? 'collapsed' : 'open';
  }

  async function handleLogout() {
    await sb.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>

      {/* ── Logo + collapse toggle ───────────────────────── */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'space-between', marginBottom:20 }}>
          <Link href="/home" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flex:1, minWidth:0 }}>
            <div style={{ width:34, height:34, background:'linear-gradient(135deg,#0179FE,#4893FF)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Euro size={18} color="#fff"/>
            </div>
            {!collapsed && <span className="sidebar-logo">Household</span>}
          </Link>
          <button
            onClick={toggleCollapse}
            data-tip={collapsed ? 'Uitklappen' : 'Inklappen'}
            style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:6, width:26, height:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6B7280', flexShrink:0, transition:'background .15s' }}
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.16)')}
            onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,.08)')}
          >
            {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
          </button>
        </div>

        {/* Navigatie — gegroepeerd */}
        <nav style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {GROEPEN.map(groep => (
            <div key={groep.label} style={{ marginBottom:8 }}>
              {!collapsed && (
                <p className="sidebar-section-label" style={{ fontSize:9, color:'#374151', fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:3, paddingLeft:12 }}>
                  {groep.label}
                </p>
              )}
              {groep.items.map(({ label, href, icon: Icon, tip }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`sidebar-link${active ? ' sidebar-link-active' : ''}`}
                    data-tip={collapsed ? tip : undefined}
                  >
                    <Icon size={17} style={{ flexShrink:0 }}/>
                    {!collapsed && <span className="sidebar-label-text">{label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:12 }}>
        <div className="sidebar-footer-user" style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 12px', marginBottom:4 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#0179FE,#4893FF)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:700, flexShrink:0 }}>
            {initialen}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info" style={{ flex:1, minWidth:0 }}>
              <p style={{ color:'#fff', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{vollnaam}</p>
              <p style={{ color:'#6B7280', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</p>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="sidebar-link" data-tip={collapsed ? t.nav.logout : undefined} style={{ marginTop:2 }}>
          <LogOut size={16} style={{ flexShrink:0 }}/>
          {!collapsed && <span className="sidebar-label-text">{t.nav.logout}</span>}
        </button>
      </div>
    </aside>
  );
}
