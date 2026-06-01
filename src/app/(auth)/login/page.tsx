'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, CheckCircle, TrendingUp, Shield, Bot } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.code === 'invalid_credentials' ? 'E-mail of wachtwoord klopt niet.' : error.message);
      setLoading(false); return;
    }
    const { data: profiel } = await supabase.from('profielen').select('onboarding_voltooid').eq('id', data.user.id).single();
    router.push(profiel?.onboarding_voltooid === false ? '/onboarding' : '/');
  }

  return (
    <div className="flex h-screen">
      {/* LEFT */}
      <div className="w-2/5 flex flex-col justify-center px-14 py-12 bg-white">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-lg gradient-blue flex items-center justify-center">
            <span className="text-white font-bold text-lg">€</span>
          </div>
          <span className="font-display text-xl font-bold text-gray-900">Family-App</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Welkom terug</h1>
        <p className="text-gray-500 mb-8">Log in om je dashboard te bekijken</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jouw@email.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full gradient-blue text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-60">
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Nog geen account?{' '}
          <a href="/register" className="text-blue-600 font-semibold hover:underline">Registreer hier</a>
        </p>
      </div>
      {/* RIGHT */}
      <div className="flex-1 bg-[#111827] flex flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="relative z-10 max-w-sm w-full">
          <h2 className="font-display text-2xl font-bold text-white mb-2 text-center">Jouw financiën,<br />altijd inzichtelijk</h2>
          <p className="text-gray-400 text-sm text-center mb-10">Alles op één plek, veilig en persoonlijk</p>
          {[
            { icon: TrendingUp, text: 'Automatische categorisatie via CSV-import' },
            { icon: Shield, text: 'Schulden en doelen altijd bij de hand' },
            { icon: Bot, text: 'AI-assistent voor persoonlijk financieel advies' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-blue-400" />
              </div>
              <span className="text-gray-300 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
