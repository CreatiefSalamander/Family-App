import { redirect }       from 'next/navigation';
import { createClient }  from '@/lib/supabase/server';
import Sidebar           from '@/components/layout/Sidebar';
import Topbar            from '@/components/layout/Topbar';
import MobileNav         from '@/components/layout/MobileNav';
import AIChatbot         from '@/components/ai/AIChatbot';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ── Auth check ──────────────────────────────────────── */
  const supabase = await createClient();  // ALTIJD AWAIT
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect('/login');

  /* ── Profiel ophalen ─────────────────────────────────── */
  const { data: profiel } = await supabase
    .from('profielen')
    .select('voornaam, achternaam, ai_persoonlijkheid')
    .eq('id', user.id)
    .single();

  /* ── Groet berekenen ─────────────────────────────────── */
  const email    = user.email ?? '';
  const voornaam = profiel?.voornaam || email.split('@')[0] || 'Abdul';
  const hour     = new Date().getHours();
  const groet    = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
  const greeting = `${groet}, ${voornaam}`;

  const today = new Date().toLocaleDateString('nl-NL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      {/* ── Desktop: sidebar (position fixed) ──────────── */}
      <Sidebar user={{ ...user, email }} profiel={profiel} />

      {/* ── Desktop: main content (margin-left 250px) ──── */}
      <div className="main-content">
        <Topbar
          title={greeting}
          subtitle={today}
          user={{ email }}
          profiel={profiel}
        />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      {/* ── Mobile: header bovenaan (CSS: display:none → flex op <768px) ── */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg,#0179FE,#4893FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: "'IBM Plex Serif',serif" }}>
              €
            </span>
          </div>
          <span style={{ fontFamily: "'IBM Plex Serif',serif", fontWeight: 700, color: '#1A1F36', fontSize: 16 }}>
            Family-App
          </span>
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg,#0179FE,#4893FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700,
        }}>
          {voornaam.slice(0, 2).toUpperCase()}
        </div>
      </header>

      {/* ── Mobile: bottom navigation ────────────────────── */}
      <MobileNav />

      {/* ── AI Chatbot — zweeft op elke pagina ───────────── */}
      <AIChatbot naam={voornaam} />
    </>
  );
}
