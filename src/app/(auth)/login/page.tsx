'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, TrendingUp, Shield, Bot, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sb = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profiel } = await sb.from('profielen').select('onboarding_voltooid').eq('id', data.user.id).single();
      router.push(profiel?.onboarding_voltooid === false ? '/onboarding' : '/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inloggen mislukt';
      setError(msg.includes('Invalid') ? 'E-mail of wachtwoord klopt niet.' : msg);
      setLoading(false);
    }
  }

  const features = [
    { icon: TrendingUp, text: 'Automatische categorisatie via CSV-import' },
    { icon: Shield, text: 'Schulden en doelen altijd bij de hand' },
    { icon: Bot, text: 'AI-assistent voor persoonlijk financieel advies' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* LEFT — FORM */}
      <div className="w-full md:w-2/5 flex flex-col justify-center px-8 md:px-14 py-12 bg-white overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center gradient-blue">
            <span className="text-white font-bold text-lg font-display">€</span>
          </div>
          <span className="font-display text-xl font-bold text-gray-900">Family-App</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2 leading-tight">Welkom terug</h1>
        <p className="text-gray-500 text-sm mb-8">Log in om je financieel dashboard te bekijken</p>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mailadres</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="jouw@email.com" required className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Wachtwoord</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                required className="input-field pr-12"
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-60">
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Nog geen account?{' '}
          <a href="/register" className="text-[#0179FE] font-semibold hover:underline">Registreer hier</a>
        </p>
      </div>

      {/* RIGHT — VISUAL */}
      <div className="hidden md:flex flex-1 bg-[#111827] flex-col items-center justify-center px-14 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#0179FE]/10" />
        <div className="absolute -bottom-24 -left-16 w-96 h-96 rounded-full bg-[#0179FE]/06" />
        <div className="relative z-10 max-w-sm w-full">
          <h2 className="font-display text-2xl font-bold text-white mb-3 leading-snug">
            Jouw financiën,<br />altijd inzichtelijk
          </h2>
          <p className="text-gray-400 text-sm mb-10">Alles op één plek, veilig en persoonlijk</p>
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3.5 mb-5">
              <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-[#0179FE]/20 flex items-center justify-center">
                <Icon size={17} className="text-[#60A5FA]" />
              </div>
              <p className="text-gray-300 text-sm leading-relaxed pt-1.5">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
