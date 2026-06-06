'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [onthoudMe, setOnthoudMe] = useState(true);
  const router = useRouter();
  const sb = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profiel } = await sb.from('profielen').select('onboarding_voltooid').eq('id', data.user.id).single();
      router.push(profiel?.onboarding_voltooid === false ? '/onboarding' : '/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inloggen mislukt';
      setError(msg.includes('Invalid') || msg.includes('credentials') ? 'E-mail of wachtwoord klopt niet.' : msg);
      setLoading(false);
    }
  }

  const bullets = [
    'Automatische CSV import van Rabobank en ING',
    'Schulden en doelen altijd bij de hand',
    'AI-assistent voor persoonlijk financieel advies',
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── MOBIEL: donkere hero bovenin (verborgen op desktop) ── */}
      <div className="lg:hidden relative bg-[#111827] px-6 pt-10 pb-20 overflow-hidden">
        {/* Decoratieve blobs */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-[rgba(1,121,254,0.12)]" />
        <div className="absolute -bottom-14 -left-8 w-52 h-52 rounded-full bg-[rgba(1,121,254,0.07)]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5 mb-6">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#0179FE,#4893FF)' }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, fontFamily: "'IBM Plex Serif',serif" }}>€</span>
          </div>
          <span style={{ fontFamily: "'IBM Plex Serif', serif", fontSize: 20, fontWeight: 700, color: '#fff' }}>
            Household
          </span>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2
            className="text-2xl font-bold text-white mb-1 leading-snug"
            style={{ fontFamily: "'IBM Plex Serif', serif" }}
          >
            Jouw financiën,<br />altijd inzichtelijk
          </h2>
          <p className="text-sm text-white/55">Alles op één plek, veilig en persoonlijk</p>
        </div>
      </div>

      {/* ── FORMULIER PANEL ── */}
      {/* Op mobiel: witte card die over de hero schuift via -mt-6 + rounded-t-3xl */}
      <div className="
        flex-1 flex flex-col
        px-6 py-8
        bg-white
        -mt-6 rounded-t-3xl
        lg:mt-0 lg:rounded-none
        lg:w-[40%] lg:flex-none
        lg:justify-center lg:px-14
        overflow-y-auto relative z-10
      ">

        {/* Logo — alleen zichtbaar op desktop */}
        <div className="hidden lg:flex items-center gap-2.5 mb-10">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#0179FE,#4893FF)' }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, fontFamily: "'IBM Plex Serif',serif" }}>€</span>
          </div>
          <span style={{ fontFamily: "'IBM Plex Serif', serif", fontSize: 21, fontWeight: 700, color: '#1A1F36' }}>
            Household
          </span>
        </div>

        <h1
          className="text-[26px] lg:text-[30px] font-bold text-[#1A1F36] mb-1.5 tracking-tight"
          style={{ fontFamily: "'IBM Plex Serif', serif" }}
        >
          Welkom terug
        </h1>
        <p className="text-sm text-[#6B7280] mb-6">Log in om je financieel dashboard te bekijken</p>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3.5 py-2.5 text-[#DC2626] text-[13px] mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full">
          {/* E-mail */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">E-mailadres</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jouw@email.com"
              required
              className="w-full border-[1.5px] border-[#E5E7EB] rounded-lg px-3.5 py-[11px] text-[14px] text-[#1A1F36] bg-white outline-none box-border transition-colors"
              style={{ fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = '#0179FE')}
              onBlur={e  => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Wachtwoord */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Wachtwoord</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border-[1.5px] border-[#E5E7EB] rounded-lg px-3.5 py-[11px] pr-11 text-[14px] text-[#1A1F36] bg-white outline-none box-border transition-colors"
                style={{ fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#0179FE')}
                onBlur={e  => (e.target.style.borderColor = '#E5E7EB')}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#9CA3AF] text-base"
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Onthoud mij + Wachtwoord vergeten */}
          <div className="flex items-center justify-between mb-5">
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#6B7280]">
              <input
                type="checkbox"
                checked={onthoudMe}
                onChange={e => setOnthoudMe(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#0179FE]"
              />
              Onthoud mij
            </label>
            <a href="#" className="text-[13px] text-[#0179FE] no-underline">
              Wachtwoord vergeten?
            </a>
          </div>

          {/* Inloggen knop */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white border-none rounded-lg py-[13px] px-5 text-[15px] font-semibold cursor-pointer transition-opacity"
            style={{
              background: 'linear-gradient(135deg,#0179FE,#4893FF)',
              boxShadow: '0 2px 8px rgba(1,121,254,.3)',
              fontFamily: 'inherit',
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? 'Bezig...' : 'Inloggen →'}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#6B7280] mt-5">
          Nog geen account?{' '}
          <a href="/register" className="text-[#0179FE] font-semibold no-underline">
            Registreer hier
          </a>
        </p>

        {/* Compacte bullets — alleen op mobiel onder het formulier */}
        <div className="lg:hidden mt-8 pt-6 border-t border-[#F3F4F6]">
          {bullets.map((text, i) => (
            <div key={i} className="flex items-start gap-3 mb-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(1,121,254,0.1)' }}
              >
                <span style={{ color: '#0179FE', fontSize: 11, fontWeight: 700 }}>✓</span>
              </div>
              <p className="text-[13px] text-[#6B7280] leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECHTER PANEL — alleen zichtbaar op desktop ── */}
      <div className="hidden lg:flex flex-1 bg-[#111827] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div
          className="absolute -top-[60px] -right-[60px] w-[280px] h-[280px] rounded-full"
          style={{ background: 'rgba(1,121,254,.12)' }}
        />
        <div
          className="absolute -bottom-[80px] -left-[40px] w-[320px] h-[320px] rounded-full"
          style={{ background: 'rgba(1,121,254,.07)' }}
        />
        <div className="relative z-10 max-w-[340px]">
          <h2
            className="text-[26px] font-bold text-white mb-2 leading-snug"
            style={{ fontFamily: "'IBM Plex Serif', serif" }}
          >
            Jouw financiën,<br />altijd inzichtelijk
          </h2>
          <p className="text-[14px] text-white/55 mb-10">Alles op één plek, veilig en persoonlijk</p>
          {bullets.map((text, i) => (
            <div key={i} className="flex items-start gap-3 mb-[18px]">
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(34,197,94,.2)' }}
              >
                <span style={{ color: '#22C55E', fontSize: 12, fontWeight: 700 }}>✓</span>
              </div>
              <p className="text-[14px] text-white/80 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
