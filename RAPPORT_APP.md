# Household App — Volledig Applicatierapport
**Laatste update:** Juni 2026 | **Branch:** nextjs-rebuild | **Live:** abdul-family-app.netlify.app

---

## Tech Stack
- **Framework:** Next.js 15.5 (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Hosting:** Netlify (auto-deploy bij git push)
- **AI:** Anthropic Claude Sonnet 4-5 (server-side)
- **PWA:** @ducanh2912/next-pwa (installeerbaar op iPhone/Android)
- **Charts:** Chart.js + react-chartjs-2
- **Icons:** Lucide React
- **Fonts:** IBM Plex Serif + Inter + JetBrains Mono

---

## Alle Pagina's

| Route | Pagina | Functie |
|---|---|---|
| `/home` | Dashboard | KPI's, TotalBalanceBox, health score, right sidebar |
| `/transacties` | Transacties | Filter/zoek, toevoegen, bon scanner |
| `/rekeningen` | Rekeningen | Bank cards glassmorphism |
| `/begroting` | Begroting | Budget progress bars |
| `/schulden` | Schulden | Schulden tracker + KPI's |
| `/doelen` | Doelen | Spaardoelen cirkel progress |
| `/zakelijk` | Zakelijk | BTW berekening + opdrachtgevers |
| `/jaaroverzicht` | Jaaroverzicht | Bar chart + maandtabel |
| `/kasboek` | Kasboek | Offline cash bijhouden + keypad |
| `/import` | Import | CSV/Excel/PDF/Word import |
| `/crypto` | Crypto | Bitvavo portfolio |
| `/reizen` | Reizen | Vluchtzoeker + tracker |
| `/prijsradar` | Prijsradar | Google Shopping |
| `/locatie` | Locatie | Weer + winkels + koersen ticker |
| `/gezin` | Gezin | Partner koppeling |
| `/instellingen` | Instellingen | Profiel + taal + API's |
| `/login` | Login | Auth + "Onthoud mij" |
| `/register` | Register | Registratie + wachtwoord sterkte |

---

## API Routes (alle server-side)

| Route | Methode | Key | Functie |
|---|---|---|---|
| `/api/ai-chat` | POST | ANTHROPIC_API_KEY | Claude AI chatbot |
| `/api/analyze-document` | POST | ANTHROPIC_API_KEY | PDF/Word analyse |
| `/api/bon-scanner` | POST | ANTHROPIC_API_KEY | Kassabon via vision |
| `/api/maandrapport` | POST | ANTHROPIC_API_KEY | HTML maandrapport |
| `/api/zoek-prijs` | POST | SERPAPI_KEY | Google Shopping |
| `/api/merchant-logo` | POST | BRANDFETCH_KEY | Winkellgo's |
| `/api/google-places` | POST | GOOGLE_PLACES_API_KEY | Winkels in de buurt |
| `/api/weer` | POST | OPENWEATHER_API_KEY | Weer + forecast |
| `/api/vlucht-tracker` | POST | AVIATIONSTACK_KEY | Vluchtstatus |
| `/api/bitvavo` | GET | BITVAVO_API_KEY/SECRET | Crypto portfolio |
| `/api/wisselkoers` | POST | — | Live valuta |
| `/api/notifications/send` | POST | FCM_SERVER_KEY | Push notificaties |
| `/api/telegram/webhook` | POST | TELEGRAM_BOT_TOKEN | Telegram bot |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://lttxjfrtfrjnlazmbcyq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
ANTHROPIC_API_KEY=...
SERPAPI_KEY=...
BRANDFETCH_KEY=...
GOOGLE_PLACES_API_KEY=...
OPENWEATHER_API_KEY=...
AVIATIONSTACK_KEY=...
BITVAVO_API_KEY=...
BITVAVO_API_SECRET=...
FCM_SERVER_KEY=...            # optioneel (Firebase push)
TELEGRAM_BOT_TOKEN=...        # optioneel
TELEGRAM_CHAT_ID=...          # optioneel
NEXT_PUBLIC_FIREBASE_API_KEY=...         # optioneel
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...     # optioneel
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...      # optioneel
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=... # optioneel
NEXT_PUBLIC_FIREBASE_APP_ID=...          # optioneel
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...       # optioneel
```

---

## Supabase Database

| Tabel | Inhoud |
|---|---|
| `profielen` | voornaam, achternaam, taal, ai_persoonlijkheid |
| `transactions` | amount, type, description, category, date |
| `accounts` | name, bank_name, balance, color_gradient |
| `budgets` | category, monthly_limit |
| `schulden` | schuldeiser, oorspronkelijk, afgelost, maandtermijn |
| `goals` | name, emoji, target_amount, current_amount |
| `ai_gesprekken` | rol, bericht, pagina |
| `categorie_regels` | zoekwoord, categorie, soort |
| `opdrachtgevers` | naam, bedrag_ex_btw, btw_percentage |
| `zakelijke_kosten` | naam, bedrag, type |
| `documenten` | naam, type, verwerkt |
| `reizen` | bestemming, vertrek_datum, budget |
| `push_tokens` | user_id, token, platform |
| `gezin_koppelingen` | eigenaar_id, partner_id, status |
| `notificatie_instellingen` | alle notificatie voorkeuren |

SQL bestanden: `supabase-setup.sql`, `supabase-fase3.sql`

---

## Design Systeem

**Kleuren:**
- Sidebar: `#111827`
- Content: `#F8FAFC`
- Primair: `#0179FE`
- Gradient: `linear-gradient(90deg, #0179FE, #4893FF)`

**Fonts:** IBM Plex Serif (logo/titels) + Inter (body) + JetBrains Mono (bedragen)

**CSS Klassen:** `.sidebar`, `.home`, `.home-content`, `.right-sidebar`, `.kpi-card`, `.card`, `.btn-primary`, `.amount`, `.header-box-title`, `.ticker-track`, `[data-tip]`

---

## Gouden Regels voor Toekomstige Ontwikkeling

1. **Server componenten:** `await createClient()` (altijd await)
2. **Browser client:** `createClient()` (geen await)
3. **Bedragen:** altijd `.amount` class (JetBrains Mono)
4. **Pagina structuur:** `<section className="home"><div className="home-content">`
5. **Build:** altijd `npm run build` testen voor push
6. **Branch:** altijd naar `nextjs-rebuild` pushen
7. **Niks breken:** alleen toevoegen, nooit verwijderen
8. **Taal:** `const { t } = useLang()` in client components

---

## Deployment
```bash
git add -A
git commit -m "feat/fix: beschrijving"
git push origin nextjs-rebuild  # ← altijd deze branch
```
Netlify deployt automatisch (~2 minuten).
