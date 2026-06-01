import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';
import AIChatbot from '@/components/ai/AIChatbot';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profiel } = await supabase.from('profielen').select('voornaam, achternaam').eq('id', user.id).single();
  const naam = profiel?.voornaam || user.email?.split('@')[0] || 'Abdul';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <div className="hidden md:flex"><Sidebar email={user.email} naam={naam} /></div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="hidden md:block"><Topbar naam={naam} /></div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        <MobileNav />
      </div>
      <AIChatbot />
    </div>
  );
}
