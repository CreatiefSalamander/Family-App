import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import AIChatbot from '@/components/ai/AIChatbot';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profiel } = await supabase
    .from('profielen').select('voornaam').eq('id', user.id).single();
  const naam = profiel?.voornaam || user.email?.split('@')[0] || 'Abdul';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar email={user.email || ''} naam={naam} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center">
              <span className="text-white font-bold text-sm">€</span>
            </div>
            <span className="font-display font-bold text-gray-900">Family-App</span>
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
