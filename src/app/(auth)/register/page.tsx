'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const LANDEN = ['Nederland','België','Duitsland','Frankrijk','Armenië','Georgië','Oostenrijk','Zwitserland','Verenigd Koninkrijk','Overig Europa'];

export default function RegisterPage() {
  const [form, setForm] = useState({ voornaam:'', achternaam:'', email:'', password:'', password2:'', straat:'', huisnummer:'', postcode:'', stad:'', land:'Nederland', geboortedatum:'' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}));

  async function handlePostcode(pc: string) {
    set('postcode', pc);
    if (pc.replace(/\s/g,'').length >= 6) {
      try {
        const r = await fetch(`https://api.zippopotam.us/nl/${pc.replace(/\s/g,'')}`);
        if (r.ok) { const d = await r.json(); set('stad', d.places?.[0]?.['place name'] || ''); }
      } catch {}
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    if (form.password !== form.password2) { setError('Wachtwoorden komen niet overeen.'); setLoading(false); return; }
    if (form.password.length < 6) { setError('Wachtwoord minimaal 6 tekens.'); setLoading(false); return; }
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profielen').upsert({ id: data.user.id, voornaam: form.voornaam, achternaam: form.achternaam, onboarding_voltooid: false });
    }
    setSuccess('Account aangemaakt! Controleer je inbox (' + form.email + ') voor de bevestigingslink.');
    setLoading(false);
  }

  const inp = (k: string, label: string, type='text', placeholder='') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(form as Record<string,string>)[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
    </div>
  );

  return (
    <div className="flex h-screen">
      <div className="w-2/5 flex flex-col justify-center px-14 py-8 bg-white overflow-y-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg gradient-blue flex items-center justify-center"><span className="text-white font-bold">€</span></div>
          <span className="font-display text-xl font-bold">Family-App</span>
        </div>
        <h1 className="font-display text-2xl font-bold mb-1">Account aanmaken</h1>
        <p className="text-gray-500 text-sm mb-6">Maak je persoonlijke finance account aan</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">{success}</div>}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">{inp('voornaam','Voornaam','text','Abdul')}{inp('achternaam','Achternaam','text','Aziz')}</div>
            {inp('email','E-mailadres','email','jouw@email.com')}
            <div className="grid grid-cols-2 gap-3">{inp('password','Wachtwoord','password','Min. 6 tekens')}{inp('password2','Bevestig','password','••••••••')}</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">{inp('straat','Straat','text','Kerkstraat')}</div>
              {inp('huisnummer','Nr.','text','1A')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                <input type="text" value={form.postcode} onChange={e => handlePostcode(e.target.value)} placeholder="1234 AB"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              {inp('stad','Stad','text','Amsterdam')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
              <select value={form.land} onChange={e => set('land', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                {LANDEN.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            {inp('geboortedatum','Geboortedatum','date')}
            <button type="submit" disabled={loading}
              className="w-full gradient-blue text-white font-semibold py-3 rounded-lg hover:opacity-90 disabled:opacity-60">
              {loading ? 'Bezig...' : 'Account aanmaken'}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-gray-500 mt-4">Al een account? <a href="/login" className="text-blue-600 font-semibold hover:underline">Terug naar inloggen</a></p>
      </div>
      <div className="flex-1 bg-[#111827] flex flex-col items-center justify-center px-12 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <h2 className="font-display text-2xl font-bold text-white text-center mb-4 relative z-10">Sluit aan bij Family-App</h2>
        <p className="text-gray-400 text-sm text-center relative z-10">Begin vandaag met het bijhouden van je financiën</p>
      </div>
    </div>
  );
}
