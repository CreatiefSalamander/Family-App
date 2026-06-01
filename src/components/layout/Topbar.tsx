'use client';
import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  naam?: string;
  email?: string;
  title?: string;
  subtitle?: string;
}

export default function Topbar({ naam, email, title, subtitle }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const sb = createClient();
  const initials = (naam || email || 'AA').slice(0, 2).toUpperCase();

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function logout() {
    setOpen(false);
    await sb.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-7 flex-shrink-0 z-10">
      <div>
        {title ? (
          <>
            <h1 className="font-display text-xl font-semibold text-[#1A1F36]">{title}</h1>
            {subtitle && <p className="text-xs text-[#6B7280] capitalize mt-0.5">{subtitle}</p>}
          </>
        ) : (
          <span className="font-display text-xl font-semibold text-[#1A1F36]">Family-App</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Notificatie bell */}
        <button className="relative w-9 h-9 border border-[#E5E7EB] rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] transition-colors">
          <Bell size={17} />
          <span className="absolute -top-1 -right-1 w-4 h-4 gradient-blue rounded-full text-white text-[9px] font-bold flex items-center justify-center">3</span>
        </button>

        {/* Avatar dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-[#F3F4F6] transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-blue flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-semibold text-[#1A1F36] leading-none">{naam || 'Abdul'}</p>
              <p className="text-[11px] text-[#6B7280] leading-none mt-0.5 truncate max-w-[120px]">{email || ''}</p>
            </div>
            <ChevronDown size={14} className={`text-[#6B7280] transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#E5E7EB]">
                <p className="text-[13px] font-semibold text-[#1A1F36]">{naam || 'Abdul'}</p>
                <p className="text-[11px] text-[#6B7280] truncate">{email || ''}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setOpen(false); router.push('/instellingen'); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#1A1F36] hover:bg-[#F3F4F6] transition-colors"
                >
                  <User size={14} className="text-[#6B7280]" /> Profiel
                </button>
                <button
                  onClick={() => { setOpen(false); router.push('/instellingen'); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#1A1F36] hover:bg-[#F3F4F6] transition-colors"
                >
                  <Settings size={14} className="text-[#6B7280]" /> Instellingen
                </button>
              </div>
              <div className="border-t border-[#E5E7EB] py-1">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} /> Uitloggen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
