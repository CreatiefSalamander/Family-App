'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeftRight, CreditCard, PieChart, TrendingDown, Target, Briefcase, BarChart2, Search, MapPin, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/', icon: Home, label: 'Overzicht' },
  { href: '/transacties', icon: ArrowLeftRight, label: 'Transacties' },
  { href: '/rekeningen', icon: CreditCard, label: 'Rekeningen' },
  { href: '/begroting', icon: PieChart, label: 'Begroting' },
  { href: '/schulden', icon: TrendingDown, label: 'Schulden' },
  { href: '/doelen', icon: Target, label: 'Doelen' },
  { href: '/zakelijk', icon: Briefcase, label: 'Zakelijk' },
  { href: '/jaaroverzicht', icon: BarChart2, label: 'Jaaroverzicht' },
  { href: '/prijsradar', icon: Search, label: 'Prijsradar' },
  { href: '/locatie', icon: MapPin, label: 'Locatie' },
  { href: '/instellingen', icon: Settings, label: 'Instellingen' },
];

export default function Sidebar({ email, naam }: { email?: string; naam?: string }) {
  const path = usePathname();
  const router = useRouter();
  const sb = createClient();
  const initials = (naam || email || 'AA').slice(0, 2).toUpperCase();

  async function logout() {
    await sb.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-[250px] flex-shrink-0 bg-[#111827] flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/8">
        <div className="w-8 h-8 rounded-lg gradient-blue flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm font-display">€</span>
        </div>
        <span className="font-display text-[19px] font-bold text-white tracking-tight">Family-App</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                active
                  ? 'bg-[#0179FE]/20 text-white'
                  : 'text-gray-400 hover:bg-white/6 hover:text-gray-200'
              }`}>
              <Icon size={17} className={active ? 'text-[#60A5FA]' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full gradient-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{naam || 'Abdul'}</p>
            <p className="text-[11px] text-gray-400 truncate">{email || ''}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 w-full text-[13px] text-gray-400 hover:bg-red-500/12 hover:text-red-300 rounded-lg transition-colors">
          <LogOut size={15} /> Uitloggen
        </button>
      </div>
    </aside>
  );
}
