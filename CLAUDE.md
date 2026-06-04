—# CLAUDE.md — Family-App

## Project
Household Finance Life OS. Live: https://abdul-family-app.netlify.app

## Stack
Next.js 15 + TypeScript, Supabase, Claude AI (server-side), Firebase (push), Chart.js, PWA, Tailwind

## KRITIEK: altijd await createClient() in server components

## Routes
- / -> redirect naar /home (ingelogd) of /login
- - /home -> dashboard (KPI, transacties, rechter panel)
  - - /transacties, /rekeningen, /begroting, /schulden, /doelen
    - - /zakelijk (Aziz Holding BV, BTW), /jaaroverzicht
      - - /kasboek, /import, /crypto, /reizen, /prijsradar
        - - /locatie, /gezin, /instellingen
         
          - ## API
          - /api/ai-chat, /api/bon-scanner, /api/bitvavo, /api/google-places
          - /api/merchant-logo, /api/maandrapport, /api/telegram/webhook
          - /api/push/subscribe|send, /api/vlucht-tracker, /api/weer
          - /api/wisselkoers, /api/zoek-prijs, /api/analyze-document
         
          - ## Lib
          - lib/supabase/client.ts + server.ts (server.ts: async, try/catch cookies)
          - lib/ai/claude.ts + personalities.ts (6 persoonlijkheden)
          - lib/bank/categorisatie.ts + csv-parser.ts (Rabobank + ING)
          - middleware.ts (auth), store/finance.ts (Zustand)
         
          - ## Layout
          - Horizon Banking stijl. Sidebar dark #111827, collapsible 250->72px.
          - Rechter panel 355px. Mobile: bottom nav + FAB. 4 talen NL/EN/HY/AR.
         
          - ## Env vars
          - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
          - ANTHROPIC_API_KEY, GOOGLE_PLACES_API_KEY, SERPAPI_KEY
          - TELEGRAM_BOT_TOKEN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
          - BITVAVO_API_KEY, OPENWEATHER_API_KEY, BRANDFETCH_KEY
          - 
