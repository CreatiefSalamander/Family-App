'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface TopbarProps {
  title: string;
  subtitle?: string;
  user: { email: string };
  profiel: { voornaam?: string; achternaam?: string } | null;
}

export default function Topbar({ title, subtitle, user, profiel }: TopbarProps) {
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const router            = useRouter();
  const sb                = createClient();

  const voornaam   = profiel?.voornaam   || '';
  const achternaam = profiel?.achternaam || '';
  const vollnaam   = [voornaam, achternaam].filter(Boolean).join(' ') || user.email.split('@')[0];
  const initialen  = (
    (voornaam[0] || '') + (achternaam[0] || '') ||
    user.email[0]
  ).toUpperCase();

  /* sluit dropdown bij klik buiten */
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  async function logout() {
    setOpen(false);
    await sb.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="topbar">

      {/* Linker kant — titel */}
      <div>
        <h1 style={{
          fontFamily: "'IBM Plex Serif', serif",
          fontSize: 20, fontWeight: 700,
          color: '#1A1F36', lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Rechter kant — bell + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Notificatie bell */}
        <button style={{
          position: 'relative', background: 'none',
          border: '1px solid #E5E7EB', borderRadius: 8,
          width: 36, height: 36, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6B7280',
        }}>
          <Bell size={17} />
          <span style={{
            position: 'absolute', top: -5, right: -5,
            width: 17, height: 17, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0179FE, #4893FF)',
            color: '#fff', fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            3
          </span>
        </button>

        {/* Avatar dropdown */}
        <div ref={ref} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', borderRadius: 10,
              transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0179FE, #4893FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {initialen}
            </div>
            <div style={{ textAlign: 'left', display: 'none' }} className="sm:block">
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', lineHeight: 1 }}>
                {vollnaam}
              </p>
              <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1, marginTop: 2 }}>
                {user.email}
              </p>
            </div>
            <ChevronDown
              size={14}
              color="#6B7280"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}
            />
          </button>

          {/* Dropdown menu */}
          {open && (
            <div style={{
              position: 'absolute', right: 0, top: 46,
              width: 200, background: '#fff',
              border: '1px solid #E5E7EB', borderRadius: 12,
              boxShadow: '0 8px 30px rgba(0,0,0,.12)',
              overflow: 'hidden', zIndex: 50,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36' }}>{vollnaam}</p>
                <p style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{user.email}</p>
              </div>
              <div style={{ padding: '4px 0' }}>
                {[
                  { icon: User,     label: 'Profiel',        href: '/instellingen' },
                  { icon: Settings, label: 'Instellingen',   href: '/instellingen' },
                ].map(({ icon: Icon, label, href }) => (
                  <button
                    key={label}
                    onClick={() => { setOpen(false); router.push(href); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '10px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, color: '#1A1F36', fontFamily: 'inherit',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <Icon size={14} color="#6B7280" />
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #E5E7EB', padding: '4px 0' }}>
                <button
                  onClick={logout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: '#EF4444', fontFamily: 'inherit',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <LogOut size={14} />
                  Uitloggen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
