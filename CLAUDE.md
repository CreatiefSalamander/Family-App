# CLAUDE.md — Family-App

## Project
Household Finance Life OS. Live: https://abdul-family-app.netlify.app
GitHub: https://github.com/CreatiefSalamander/Family-App
Branch: **nextjs-rebuild** (altijd naar deze branch pushen)
Status: **Ver gevorderd — alle 18 pagina's aanwezig**

## Stack
- Next.js **15.3** + React **19** + **TypeScript**
- Supabase (@supabase/supabase-js ^2.49.0 + @supabase/ssr ^0.6.1)
- Firebase ^12.14.0 (push notificaties — beide worden gebruikt naast Supabase)
- Claude AI / Anthropic SDK ^0.100.1 (server-side, 6 persoonlijkheden)
- Chart.js + react-chartjs-2 + Recharts
- Zustand ^5.0.0 (state management)
- Tailwind CSS 4
- PWA via @ducanh2912/next-pwa
- Hosting: Netlify (@netlify/plugin-nextjs)

## KRITIEK
- Server components: altijd `await createClient()` (async)
- Browser client: `createClient()` (geen await)
- Bedragen: altijd `.amount` class (JetBrains Mono font)
- Altijd naar branch `nextjs-rebuild` pushen, nooit naar main

## Paginas (src/app/) — alle aanwezig ✅

### Route group: (auth)
- [x] /login - Auth + "Onthoud mij"
- [x] /register - Registratie + wachtwoord sterkte
- [x] /onboarding - Onboarding flow

### Route group: (dashboard)
- [x] /home - Dashboard (KPI's, TotalBalanceBox, health score, right sidebar)
- [x] /transacties - Filter/zoek, toevoegen, bon scanner
- [x] /rekeningen - Bankkaarten glassmorphism
- [x] /begroting - Budget progress bars
- [x] /schulden - Schulden tracker + KPI's
- [x] /doelen - Spaardoelen cirkel progress
- [x] /zakelijk - BTW berekening + opdrachtgevers (Aziz Holding BV)
- [x] /jaaroverzicht - Bar chart + maandtabel
- [x] /kasboek - Offline cash bijhouden + keypad
- [x] /import - CSV/Excel/PDF/Word import
- [x] /crypto - Bitvavo portfolio integratie
- [x] /reizen - Vluchtzoeker + tracker
- [x] /prijsradar - Google Shopping
- [x] /locatie - Weer + winkels + koersen ticker
- [x] /gezin - Partner koppeling
- [x] /instellingen - Profiel + taal + API's

## API routes (app/api/) — alle aanwezig ✅
- [x] /api/ai-chat - Claude AI chatbot
- [x] /api/bon-scanner - Kassabon via vision
- [x] /api/analyze-document - PDF/Word analyse
- [x] /api/maandrapport - HTML maandrapport
- [x] /api/zoek-prijs - Google Shopping (SERPAPI)
- [x] /api/merchant-logo - Winkellogo's (Brandfetch)
- [x] /api/google-places - Winkels in de buurt
- [x] /api/weer - Weer + forecast (OpenWeatherMap)
- [x] /api/vlucht-tracker - Vluchtstatus (AviationStack)
- [x] /api/bitvavo - Crypto portfolio
- [x] /api/wisselkoers - Live valuta
- [x] /api/telegram/webhook - Telegram bot
- [x] /api/notifications/send - Firebase push notificaties

## Lib
- lib/supabase/client.ts + server.ts (server.ts: async, try/catch cookies)
- lib/ai/claude.ts + personalities.ts (6 persoonlijkheden)
- lib/bank/categorisatie.ts + csv-parser.ts (Rabobank + ING)
- lib/api-auth.ts (requireAuth helper voor alle API routes)
- middleware.ts (auth), store/finance.ts (Zustand)

## Design
- Horizon Banking stijl
- Sidebar: `#111827`, collapsible 250→72px
- Content: `#F8FAFC`, primair: `#0179FE`
- Rechter panel: 355px
- Mobile: bottom nav + FAB
- Fonts: IBM Plex Serif + Inter + JetBrains Mono
- 4 talen: NL/EN/HY/AR via `useLang()`

## Env vars
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- ANTHROPIC_API_KEY, GOOGLE_PLACES_API_KEY, SERPAPI_KEY
- TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET
- BITVAVO_API_KEY, BITVAVO_API_SECRET
- OPENWEATHER_API_KEY, AVIATIONSTACK_KEY, BRANDFETCH_KEY
- FCM_SERVER_KEY (Firebase push)
- NEXT_PUBLIC_FIREBASE_* (Firebase config)

## Gouden regels
1. Lees dit bestand EERST — altijd
2. Verander NOOIT de tech stack zonder toestemming
3. Zowel Supabase ALS Firebase worden gebruikt — verwijder geen van beide
4. Schrijf altijd kleine gerichte wijzigingen — nooit alles tegelijk herschrijven
5. Na elke sessie: update dit bestand + push naar nextjs-rebuild
6. Code-comments in het Nederlands
7. Bij twijfel: vraag eerst, doe daarna

## Sessie Log
| Datum | Wat gedaan | Wat volgende keer |
|-------|-----------|-------------------|
| 2026-06-04 | CLAUDE.md volledig herschreven: Next.js 15.3 + React 19, alle 18 pagina's afgevinkt, route groups gedocumenteerd, Telegram + Bitvavo toegevoegd | — |
| 2026-06-05 | Security: api-auth.ts aangemaakt, 12 API routes beveiligd met requireAuth(), gelekte Supabase key geroteerd, security headers toegevoegd, src/index.html opgeschoond, repo public gemaakt | Rate limiting op Anthropic routes + Zod input validatie |
