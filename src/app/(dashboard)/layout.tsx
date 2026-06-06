import { redirect }                  from 'next/navigation';
import { createClient }             from '@/lib/supabase/server';
import { LangProvider }             from '@/lib/lang-context';
import { setupNieuweGebruiker }     from '@/lib/setup-user';
import Sidebar                      from '@/components/layout/Sidebar';
import MobileNav                    from '@/components/layout/MobileNav';
import AIChatbot                    from '@/components/ai/AIChatbot';
import type { Lang }                from '@/lib/translations';
import { Euro, Bell }               from 'lucide-react';

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

      {/* ── Mobiel: vaste header bovenaan ─────────────────── */}
      <header className="mobile-header">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:30, height:30, borderRadius:8,
            background:'linear-gradient(135deg,#0179FE,#4893FF)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Euro size={16} color="#fff" />
          </div>
          <span style={{ fontFamily:"'IBM Plex Serif',serif", fontWeight:700, color:'#fff', fontSize:17 }}>
            Household
          </span>
        </div>
        {/* Notificatie bell + avatar rechts */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button style={{
            width:34, height:34, borderRadius:'50%',
            background:'rgba(255,255,255,.08)',
            border:'1px solid rgba(255,255,255,.12)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'rgba(255,255,255,.7)',
          }}>
            <Bell size={16} />
          </button>
          <div style={{
            width:34, height:34, borderRadius:'50%',
            background:'linear-gradient(135deg,#0179FE,#4893FF)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontSize:13, fontWeight:700,
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
