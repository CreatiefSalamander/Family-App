import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n: string) => request.cookies.get(n)?.value,
        set: (n, v, o) => { request.cookies.set({name:n,value:v,...o}); response.cookies.set({name:n,value:v,...o}); },
        remove: (n, o) => { request.cookies.set({name:n,value:'',...o}); response.cookies.set({name:n,value:'',...o}); },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const isAuth = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register') || request.nextUrl.pathname.startsWith('/onboarding');
  if (!user && !isAuth) return NextResponse.redirect(new URL('/login', request.url));
  if (user && request.nextUrl.pathname === '/login') return NextResponse.redirect(new URL('/', request.url));
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
