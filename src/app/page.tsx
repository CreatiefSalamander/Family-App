import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/login')
    }
    // Ingelogd: (dashboard)/page.tsx via layout
  } catch {
    redirect('/login')
  }
}
