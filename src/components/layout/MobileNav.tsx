'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeftRight, CreditCard, PieChart, Settings } from 'lucide-react';

const ITEMS = [
  { href: '/home',         icon: Home,             label: 'Overzicht'    },
  { href: '/transacties',  icon: ArrowLeftRight,   label: 'Transacties'  },
  { href: '/rekeningen',   icon: CreditCard,       label: 'Rekeningen'   },
  { href: '/begroting',    icon: PieChart,         label: 'Begroting'    },
  { href: '/instellingen', icon: Settings,         label: 'Meer'         },
];

export default function MobileNav() {
  const path = usePathname();

  return (
    <nav style={{
      /* Alleen zichtbaar op mobiel — desktop via CSS verborgen */
      display: 'none',  /* CSS media query overschrijft dit */
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 64,
      background: '#ffffff',
      borderTop: '1px solid #E5E7EB',
      zIndex: 50,
      alignItems: 'center',
      padding: '0 4px',
      /* safe-area voor iPhones met notch */
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }} className="mobile-bottom-nav">
      {ITEMS.map(({ href, icon: Icon, label }) => {
        const active = path === href || path.startsWith(href + '/');
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
              padding: '6px 4px',
              textDecoration: 'none',
              color: active ? '#0179FE' : '#9CA3AF',
              transition: 'color .15s',
              /* Minimaal 44×44px touch target (Apple richtlijn) */
              minHeight: 52,
              position: 'relative',
            }}
          >
            {/* Actief indicator bovenaan */}
            {active && (
              <span style={{
                position: 'absolute',
                top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 24, height: 3,
                borderRadius: '0 0 3px 3px',
                background: 'linear-gradient(90deg,#0179FE,#4893FF)',
              }} />
            )}
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              letterSpacing: '.01em',
              fontFamily: "'Inter',sans-serif",
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
