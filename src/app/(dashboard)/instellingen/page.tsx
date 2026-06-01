'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Bot, Database } from 'lucide-react';

const TABS = [
  { id: 'profiel', label: 'Profiel', icon: User },
  { id: 'ai', label: 'Claude AI', icon: Bot },
  { id: 'supabase', label: 'Supabase', icon: Database },
];

export default function InstellingenPage() {
  const [tab, setTab] = useState('profiel');
  const [naam, setNaam] = useState('');
  const [email, setEmail] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [supaStatus, setSupaStatus] = useState('');
  const [claudeStatus, setClaudeStatus] = useState('');
  const sb = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');
      const { data } = await sb.from('profielen').select('voornaam').eq('id', user.id).single();
      if (data) setNaam((data as { voornaam?: string }).voornaam || '');
      const k = localStorage.getItem('claude_api_key');
      if (k) setClaudeKey('••••••••••••••••');
    }
    load();
  }, []);

  async function testSupabase() {
    setSupaStatus('Testen...');
    try {
      const { error } = await sb.from('transactions').select('id').limit(1);
      setSupaStatus(error ? '✗ ' + error.message : '✓ Verbinding geslaagd');
    } catch {
      setSupaStatus('✗ Verbindingsfout');
    }
  }

  async function testClaude() {
    const k = localStorage.getItem('claude_api_key');
    if (!k) { setClaudeStatus('Geen API key'); return; }
    setClaudeStatus('Testen...');
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': k,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }),
      });
      const d = await r.json();
      setClaudeStatus(d.error ? '✗ ' + d.error.message : '✓ Verbinding geslaagd');
    } catch {
      setClaudeStatus('✗ Fout');
    }
  }

  function saveClaudeKey() {
    if (claudeKey && claudeKey !== '••••••••••••••••') {
      localStorage.setItem('claude_api_key', claudeKey);
      setClaudeKey('••••••••••••••••');
      alert('API key opgeslagen');
    }
  }

  return (
    <div className="px-7 py-6">
      <h1 className="font-display text-2xl font-bold mb-6">Instellingen</h1>
      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition ${
                tab === t.id ? 'bg-blue-50 text-[#0179FE]' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {tab === 'profiel' && (
            <div className="card p-6">
              <h2 className="font-bold text-base mb-5">Profiel</h2>
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-full gradient-blue flex items-center justify-center text-white text-xl font-bold">
                  {naam.slice(0, 2).toUpperCase() || 'AA'}
                </div>
                <div>
                  <p className="font-semibold text-lg">{naam || 'Abdul Aziz'}</p>
                  <p className="text-sm text-gray-400">{email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Voornaam</label>
                  <input
                    type="text"
                    value={naam}
                    onChange={e => setNaam(e.target.value)}
                    className="w-full max-w-sm border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full max-w-sm border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="card p-6">
              <h2 className="font-bold text-base mb-5">Claude AI</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm font-medium block mb-1">Claude API Key</label>
                  <input
                    type="password"
                    value={claudeKey}
                    onChange={e => setClaudeKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Model</label>
                  <input
                    type="text"
                    value="claude-sonnet-4-5"
                    readOnly
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={saveClaudeKey} className="gradient-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90">
                    Opslaan
                  </button>
                  <button onClick={testClaude} className="border border-gray-200 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50">
                    Verbinding testen
                  </button>
                </div>
                {claudeStatus && (
                  <p className={`text-sm ${claudeStatus.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                    {claudeStatus}
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === 'supabase' && (
            <div className="card p-6">
              <h2 className="font-bold text-base mb-5">Supabase</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm font-medium block mb-1">Project URL</label>
                  <input
                    type="text"
                    value="https://lttxjfrtfrjnlazmbcyq.supabase.co"
                    readOnly
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Anon Key</label>
                  <input
                    type="text"
                    value="sb_publishable_SLofdkgzrdibQzeP5v_bew_bIBDTFAD"
                    readOnly
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-xs bg-gray-50 text-gray-500"
                  />
                </div>
                <button onClick={testSupabase} className="border border-gray-200 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50">
                  Verbinding testen
                </button>
                {supaStatus && (
                  <p className={`text-sm ${supaStatus.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                    {supaStatus}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
