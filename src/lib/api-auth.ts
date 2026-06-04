// Helper om authenticatie te controleren in API routes
// Gebruik: const authResult = await requireAuth(); if (authResult.error) return authResult.error;
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

// Type definitie voor het resultaat van de auth check
type AuthResultSuccess = { user: User; error: null };
type AuthResultFailure = { user: null; error: NextResponse };
type AuthResult = AuthResultSuccess | AuthResultFailure;

export async function requireAuth(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Niet geautoriseerd — log eerst in' },
          { status: 401 }
        ),
      };
    }

    return { user, error: null };
  } catch {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Auth check mislukt' },
        { status: 500 }
      ),
    };
  }
}
