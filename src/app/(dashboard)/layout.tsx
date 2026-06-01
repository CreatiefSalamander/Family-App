import { redirect }       from 'next/navigation';
import { createClient }  from '@/lib/supabase/server';
import { LangProvider }  from '@/lib/lang-context';
import Sidebar           from '@/components/layout/Sidebar';
import MobileNav         from '@/components/layout/MobileNav';
import AIChatbot         from '@/components/ai/AIChatbot';
import type { Lang }     from '@/lib/translations';
import { Euro }          from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ── Auth check ──────────────────────────────────────── */
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');

  /* ── Profiel + taal ophalen ──────────────────────────── */
  const { data: profiel } = await supabase
    .from('profielen')
    .select('voornaam, achternaam, ai_persoonlijkheid, taal')
    .eq('id', user.id)
    .single();

  const lang      = (profiel?.taal || 'nl') as Lang;
  const voornaam  = profiel?.voornaam || user.email?.split('@')[0] || 'Abdul';
  const email     = user.email ?? '';

  return (
    <LangProvider lang={lang}>
      {/*
       * HORIZON LAYOUT:
       * <main flex h-screen>
       *   <Sidebar sticky />
       *   <div flex-1 flex-col overflow-hidden>
       *     {children}  ← each page provides its own scrollable content
       *   </div>
       * </main>
       */}
      <main style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
      }}>

        {/* Desktop sidebar */}
        <Sidebar user={{ email }} profiel={profiel} />

        {/* Content area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {children}
        </div>

      </main>

      {/* Mobile fixed header */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg,#0179FE,#4893FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Euro size={15} color="#fff" />
          </div>
          <span style={{
            fontFamily: "'IBM Plex Serif',serif",
            fontWeight: 700, color: '#fff', fontSize: 16,
          }}>
            Family-App
          </span>
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(135deg,#0179FE,#4893FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700,
        }}>
          {voornaam.slice(0, 2).toUpperCase()}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* AI chatbot zweeft op elke pagina */}
      <AIChatbot naam={voornaam} />
    </LangProvider>
  );
}
