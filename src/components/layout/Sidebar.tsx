'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, ArrowLeftRight, CreditCard, PieChart,
  TrendingDown, Target, Briefcase, BarChart2,
  Search, Settings, LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  { href: '/instellingen', icon: Settings, label: 'Instellingen' },
];

export default function Sidebar({ email, naam }: { email?: string; naam?: string }) {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const initials = (naam || email || 'AA').slice(0, 2).toUpperCase();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-[250px] flex-shrink-0 bg-[#111827] flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-6 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg gradient-blue flex items-center justify-center">
          <span className="text-white font-bold text-base">€</span>
        </div>
        <span className="font-display text-xl font-bold text-white">Family-App</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== '/' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-[#0179FE]/20 text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} className={active ? 'text-[#4893FF]' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-9 h-9 rounded-full gradient-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{naam || 'Abdul'}</div>
            <div className="text-xs text-gray-400 truncate">{email || ''}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition"
        >
          <LogOut size={16} />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
