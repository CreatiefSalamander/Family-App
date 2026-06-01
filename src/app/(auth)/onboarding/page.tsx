'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AI_PERSONALITIES } from '@/lib/ai/personalities';
import type { AIPersonality } from '@/types';

export default function OnboardingPage() {
  const [stap, setStap] = useState(1);
  const [persoonlijkheid, setPersoonlijkheid] = useState<AIPersonality>('vriend');
  const router = useRouter();
  const sb = createClient();

  async function finish() {
    const { data: { user } } = await sb.auth.getUser();
    if (user) await sb.from('profielen').upsert({ id: user.id, ai_persoonlijkheid: persoonlijkheid, onboarding_voltooid: true });
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex justify-center gap-2 mb-8">
          {[1,2,3].map(i => (
            <div key={i} className={`h-1.5 w-16 rounded-full ${i <= stap ? 'gradient-blue' : 'bg-gray-200'}`} />
          ))}
        </div>

        {stap === 1 && (
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="font-display text-2xl font-bold mb-3">Welkom bij Family-App!</h1>
            <p className="text-gray-500 mb-8">Jouw persoonlijke finance manager. We gaan je snel op weg helpen.</p>
            <button onClick={() => setStap(2)} className="gradient-blue text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90">
              Aan de slag →
            </button>
          </div>
        )}

        {stap === 2 && (
          <div className="card p-8">
            <h2 className="font-display text-xl font-bold text-center mb-2">Kies je AI-stijl</h2>
            <p className="text-sm text-gray-500 text-center mb-6">Hoe wil je dat je AI-assistent met je communiceert?</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(Object.entries(AI_PERSONALITIES) as [AIPersonality, typeof AI_PERSONALITIES[AIPersonality]][]).map(([id, p]) => (
                <button
                  key={id}
                  onClick={() => setPersoonlijkheid(id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    persoonlijkheid === id ? 'border-[#0179FE] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <div className="font-semibold text-sm">{p.naam}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.beschrijving}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStap(3)} className="w-full gradient-blue text-white py-3 rounded-xl font-semibold hover:opacity-90">
              Volgende →
            </button>
          </div>
        )}

        {stap === 3 && (
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">🏦</div>
            <h2 className="font-display text-xl font-bold mb-2">Bank koppelen</h2>
            <p className="text-sm text-gray-500 mb-6">
              Verbind je bank voor automatische transacties, of sla dit over en voer ze handmatig in.
            </p>
            <div className="space-y-3">
              <button className="w-full gradient-blue text-white py-3 rounded-xl font-semibold hover:opacity-90">
                Koppel via Open Banking
              </button>
              <button className="w-full border border-gray-200 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">
                Upload CSV bestand
              </button>
              <button onClick={finish} className="w-full text-gray-400 text-sm hover:text-gray-600 pt-2">
                Sla over, doe dit later →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
