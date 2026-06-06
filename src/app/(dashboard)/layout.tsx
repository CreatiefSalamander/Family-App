import { redirect }                  from 'next/navigation';
import { cookies }                  from 'next/headers';
import { createClient }             from '@/lib/supabase/server';
import { LangProvider }             from '@/lib/lang-context';
import { setupNieuweGebruiker }     from '@/lib/setup-user';
import { DEMO_USER }                from '@/lib/demo-data';
import Sidebar                      from '@/components/layout/Sidebar';
import MobileNav                    from '@/components/layout/MobileNav';
import MobileHeaderClient           from '@/components/layout/MobileHeaderClient';
import AIChatbot                    from '@/components/ai/AIChatbot';
import DemoBanner                   from '@/components/layout/DemoBanner';
import type { Lang }                from '@/lib/translations';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Controleer demo cookie vóór Supabase auth
  const cookieStore = await cookies();
  const isDemoMode = cookieStore.get('demo_mode')?.value === '1';

  let voornaam: string;
  let email: string;

  if (isDemoMode) {
    // Demo modus — sla Supabase auth over
    voornaam = DEMO_USER.voornaam;
    email    = DEMO_USER.email;
  } else {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) redirect('/login');

    const { data: profiel } = await supabase
      .from('profielen')
      .select('voornaam, achternaam, ai_persoonlijkheid, taal, onboarding_voltooid')
      .eq('id', user!.id)
      .single();

    voornaam = profiel?.voornaam || user!.email?.split('@')[0] || '';
    email    = user!.email ?? '';

    /* ── Eerste login: vul standaard data in ──────────────── */
    if (!profiel?.onboarding_voltooid) {
      const supabase2 = await createClient();
      setupNieuweGebruiker(supabase2, user!.id).catch(() => {});
    }
  }

  const lang     = 'nl' as Lang;
  const initialen = voornaam ? voornaam.slice(0, 2).toUpperCase() : email.slice(0, 2).toUpperCase();

  return (
    <LangProvider lang={lang}>
      {/* Demo banner — zichtbaar bovenaan als demo modus actief */}
      {isDemoMode && <DemoBanner />}

      {/* ══════════════════════════════════════════════════
          DESKTOP: flex h-screen (Horizon layout)
          MOBILE:  app-main + content-wrapper (CSS klassen)
          ══════════════════════════════════════════════════ */}
      <main
        className="app-main"
        style={{
          display: 'flex',
          height: isDemoMode ? 'calc(100vh - 40px)' : '100vh',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: '#F8FAFC',
        }}
      >
        {/* Sidebar — sticky, verborgen op mobiel via CSS */}
        <Sidebar user={{ email }} profiel={null} />

        {/* Content area — .content-wrapper handelt mobiel scroll af */}
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* ── Mobiel: header + slide-in drawer (client component) ─ */}
      <MobileHeaderClient
        initialen={initialen}
        voornaam={voornaam}
        email={email}
      />

      {/* ── Mobiel: bottom navigation ─────────────────────── */}
      <MobileNav />

      {/* ── AI chatbot zweeft rechtsonder ─────────────────── */}
      <AIChatbot naam={voornaam} />
    </LangProvider>
  );
}
