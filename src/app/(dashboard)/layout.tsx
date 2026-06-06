import { redirect }                  from 'next/navigation';
import { createClient }             from '@/lib/supabase/server';
import { LangProvider }             from '@/lib/lang-context';
import { setupNieuweGebruiker }     from '@/lib/setup-user';
import Sidebar                      from '@/components/layout/Sidebar';
import MobileNav                    from '@/components/layout/MobileNav';
import AIChatbot                    from '@/components/ai/AIChatbot';
import type { Lang }                from '@/lib/translations';
import { Euro, Bell, RefreshCw }    from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');

  const { data: profiel } = await supabase
    .from('profielen')
    .select('voornaam, achternaam, ai_persoonlijkheid, taal, onboarding_voltooid')
    .eq('id', user.id)
    .single();

  const lang     = (profiel?.taal || 'nl') as Lang;
  const voornaam = profiel?.voornaam || user.email?.split('@')[0] || '';
  const email    = user.email ?? '';
  const initialen = voornaam ? voornaam.slice(0, 2).toUpperCase() : email.slice(0, 2).toUpperCase();

  /* ── Eerste login: vul standaard data in ──────────────── */
  if (!profiel?.onboarding_voltooid) {
    setupNieuweGebruiker(supabase, user.id).catch(() => {});
  }

  return (
    <LangProvider lang={lang}>
      {/* ══════════════════════════════════════════════════
          DESKTOP: flex h-screen (Horizon layout)
          MOBILE:  app-main + content-wrapper (CSS klassen)
          ══════════════════════════════════════════════════ */}
      <main
        className="app-main"
        style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: '#F8FAFC',
        }}
      >
        {/* Sidebar — sticky, verborgen op mobiel via CSS */}
        <Sidebar user={{ email }} profiel={profiel} />

        {/* Content area — .content-wrapper handelt mobiel scroll af */}
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* ── Mobiel: vaste header bovenaan — Dyme-stijl ──── */}
      <header className="mobile-header" style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #F0F0F0',
        height: 60,
        padding: '0 16px',
      }}>
        {/* Links: hamburger menu */}
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            WebkitTapHighlightColor: 'transparent',
            minHeight: 'unset',
          }}
          onClick={() => {}}
          aria-label="Menu"
        >
          <div style={{ width: 22, height: 2, background: '#1A1F36', borderRadius: 2 }} />
          <div style={{ width: 22, height: 2, background: '#1A1F36', borderRadius: 2 }} />
          <div style={{ width: 16, height: 2, background: '#1A1F36', borderRadius: 2 }} />
        </button>

        {/* Midden: app naam */}
        <span style={{
          fontFamily: "'IBM Plex Serif', serif",
          fontSize: 18,
          fontWeight: 700,
          color: '#1A1F36',
        }}>
          Household
        </span>

        {/* Rechts: refresh + blauwe avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 6,
            WebkitTapHighlightColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'unset',
          }}
          aria-label="Vernieuwen"
          >
            <RefreshCw size={20} color="#9CA3AF" />
          </button>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#0179FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {initialen || '?'}
          </div>
        </div>
      </header>

      {/* ── Mobiel: bottom navigation ─────────────────────── */}
      <MobileNav />

      {/* ── AI chatbot zweeft rechtsonder ─────────────────── */}
      <AIChatbot naam={voornaam} />
    </LangProvider>
  );
}
