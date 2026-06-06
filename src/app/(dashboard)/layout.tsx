import { redirect }                  from 'next/navigation';
import { createClient }             from '@/lib/supabase/server';
import { LangProvider }             from '@/lib/lang-context';
import { setupNieuweGebruiker }     from '@/lib/setup-user';
import Sidebar                      from '@/components/layout/Sidebar';
import MobileNav                    from '@/components/layout/MobileNav';
import MobileHeaderClient           from '@/components/layout/MobileHeaderClient';
import AIChatbot                    from '@/components/ai/AIChatbot';
import type { Lang }                from '@/lib/translations';

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
