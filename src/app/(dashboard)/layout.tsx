import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';
import AIChatbot from '@/components/ai/AIChatbot';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profiel } = await supabase
    .from('profielen')
    .select('voornaam, achternaam, ai_persoonlijkheid')
    .eq('id', user.id)
    .single();

  const naam = profiel?.voornaam || user.email?.split('@')[0] || 'Abdul';
  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: nl });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? `Goedemorgen, ${naam}` : hour < 18 ? `Goedemiddag, ${naam}` : `Goedenavond, ${naam}`;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar email={user.email || ''} naam={naam} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Topbar */}
        <div className="hidden md:block">
          <Topbar naam={naam} email={user.email || ''} title={greeting} subtitle={today} />
        </div>

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center">
              <span className="text-white font-bold text-sm font-display">€</span>
            </div>
            <span className="font-display font-bold text-[#1A1F36]">Family-App</span>
          </div>
          <div className="w-8 h-8 rounded-full gradient-blue flex items-center justify-center text-white text-xs font-bold">
            {naam.slice(0, 2).toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        <MobileNav />
      </div>

      {/* AI chatbot op elke pagina */}
      <AIChatbot naam={naam} />
    </div>
  );
}
