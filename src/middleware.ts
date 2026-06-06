import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options ?? {})
          );
        },
      },
    }
  );

  /* Sessie verversen — NOOIT weglaten */
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  /* Demo modus — cookie bypass (geen Supabase account nodig) */
  const isDemoMode = request.cookies.get('demo_mode')?.value === '1';

  const isAuthPagina = pathname.startsWith('/login') ||
                       pathname.startsWith('/register') ||
                       pathname.startsWith('/onboarding');

  /* Demo modus mag altijd door naar dashboard */
  if (isDemoMode && !isAuthPagina) {
    return supabaseResponse;
  }

  /* Niet ingelogd + geen auth pagina → naar login */
  if (!user && !isAuthPagina) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  /* Ingelogd + op login pagina → naar /home (alleen als remember-me actief) */
  if (user && pathname === '/login') {
    const heeftPersistCookie = request.cookies.get('household_persist')?.value === '1';
    if (heeftPersistCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/home';
      return NextResponse.redirect(url);
    }
    /* Geen remember-me: wis auth cookies en toon login */
    const response = NextResponse.next({ request });
    const authCookies = request.cookies.getAll().filter(c => c.name.startsWith('sb-'));
    authCookies.forEach(c => response.cookies.delete(c.name));
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match alle paden BEHALVE:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - bestanden met extensie (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
