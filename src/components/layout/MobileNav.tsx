'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeftRight, CreditCard, PieChart, Settings } from 'lucide-react';

const ITEMS = [
  { href: '/', icon: Home, label: 'Overzicht' },
  { href: '/transacties', icon: ArrowLeftRight, label: 'Transacties' },
  { href: '/rekeningen', icon: CreditCard, label: 'Rekeningen' },
  { href: '/begroting', icon: PieChart, label: 'Begroting' },
  { href: '/instellingen', icon: Settings, label: 'Meer' },
];

export default function MobileNav() {
  const path = usePathname();
  return (
    <nav className="md:hidden flex bg-white border-t border-gray-200 px-1 pb-safe">
      {ITEMS.map(({ href, icon: Icon, label }) => {
        const active = path === href || (href !== '/' && path.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              active ? 'text-[#0179FE]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
