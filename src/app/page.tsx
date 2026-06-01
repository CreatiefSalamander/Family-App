import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Root: check auth server-side, stuur door naar login als niet ingelogd
// De (dashboard)/page.tsx levert de echte content via de layout
export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  // User is ingelogd: (dashboard)/layout.tsx + (dashboard)/page.tsx nemen het over
  // Dit return statement wordt nooit bereikt door de middleware routing
  return null;
}
