# Family-App — Next.js 14

Premium persoonlijke finance app gebouwd op Next.js 14, TypeScript, Tailwind CSS en Supabase.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Taal**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **AI**: Claude claude-sonnet-4-5 (Anthropic)
- **Charts**: Recharts
- **Icons**: Lucide React

## Pagina's
- `/login` — Inloggen (Horizon-stijl split layout)
- `/register` — Registreren met adresgegevens
- `/onboarding` — AI-persoonlijkheid kiezen + bank koppelen
- `/` — Dashboard (KPI's, transacties, rechter panel)
- `/transacties` — Transactietabel met filters
- `/rekeningen` — Glassmorphism bank cards
- `/begroting` — Budget per categorie
- `/schulden` — Schuldenbeheer
- `/doelen` — Spaardoelen
- `/zakelijk` — Aziz Holding BV overzicht
- `/jaaroverzicht` — Recharts grafiek per jaar
- `/prijsradar` — Prijsvergelijking
- `/instellingen` — Profiel, Claude AI key, Supabase

## Setup

### 1. Installeer dependencies
\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

### 2. Environment variables
Aanwezig in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Supabase migration
Voer `src/supabase/migrations/001_initial.sql` uit in de Supabase SQL editor.

### 4. Starten
\`\`\`bash
npm run dev
\`\`\`

### 5. Bouwen voor productie
\`\`\`bash
npm run build
\`\`\`

## Deploy naar Netlify
\`\`\`bash
git add .
git commit -m "feat: Family-App Next.js v1"
git push
\`\`\`

Netlify detecteert automatisch Next.js via `netlify.toml`.

## Claude AI instellen
Ga naar Instellingen → Claude AI → vul je API key in.
