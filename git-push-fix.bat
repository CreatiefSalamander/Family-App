@echo off
cd /d "C:\Users\abdul\OneDrive\Documenten\Claude\Projects\Family-App"

echo Verwijder stale git lock (als aanwezig)...
del /f .git\index.lock 2>nul

echo Verifieer branch (moet nextjs-rebuild zijn)...
git checkout nextjs-rebuild

echo Stagen — alle gewijzigde bestanden uit sessie 11+12...
git add "src/app/globals.css"
git add "src/app/layout.tsx"
git add "src/app/(auth)/login/page.tsx"
git add "src/app/(auth)/register/page.tsx"
git add "src/app/(dashboard)/home/page.tsx"
git add "src/app/(dashboard)/instellingen/page.tsx"
git add "src/app/(dashboard)/layout.tsx"
git add "src/app/(dashboard)/transacties/page.tsx"
git add "src/app/(dashboard)/schulden/page.tsx"
git add "src/app/(dashboard)/zakelijk/page.tsx"
git add "src/app/api/ai-chat/route.ts"
git add "src/app/api/analyze-document/route.ts"
git add "src/app/api/bon-scanner/route.ts"
git add "src/app/api/google-places/route.ts"
git add "src/app/api/maandrapport/route.ts"
git add "src/app/api/vlucht-tracker/route.ts"
git add "src/app/api/wisselkoers/route.ts"
git add "src/app/api/zoek-prijs/route.ts"
git add "src/components/ai/AIChatbot.tsx"
git add "src/components/finance/BonScanner.tsx"
git add "src/components/layout/MobileNav.tsx"
git add "src/components/layout/Sidebar.tsx"
git add "src/components/layout/DemoBanner.tsx"
git add "src/components/layout/MobileHeaderClient.tsx"
git add "src/components/ui/BankCard.tsx"
git add "src/components/ui/TotalBalanceBox.tsx"
git add "src/lib/rate-limit.ts"
git add "src/lib/demo-context.tsx"
git add "src/lib/demo-data.ts"
git add "src/lib/use-demo-data.ts"
git add "src/middleware.ts"
git add ".gitignore"
git add "next.config.ts"
git add "package.json"
git add "tailwind.config.ts"
git add "CLAUDE.md"

echo Committen (sessies 11+12)...
git commit -m "fix: mobile layout + auth + performance (sessies 11-12)"

echo Pushen naar nextjs-rebuild...
git push origin nextjs-rebuild

echo.
echo ════════════════════════════════════════════════════
echo  KLAAR — Netlify deploy start automatisch.
echo.
echo  VERGEET NIET in Netlify env vars toevoegen:
echo    SUPABASE_SERVICE_ROLE_KEY = ^<service_role key^>
echo    (Supabase ^> Settings ^> API ^> service_role)
echo ════════════════════════════════════════════════════
pause
