'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmt, fmtDate } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import type { Rekening, Transactie } from '@/types';

const GRADS: Record<string, string> = {
  blue: 'linear-gradient(135deg,#0179FE,#4893FF)',
  teal: 'linear-gradient(135deg,#01797A,#489399)',
  purple: 'linear-gradient(135deg,#6172F3,#A855F7)',
  green: 'linear-gradient(135deg,#059669,#34D399)',
};

export default function RekeningenPage() {
  const [rekeningen, setRekeningen] = useState<Rekening[]>([]);
  const [transacties, setTransacties] = useState<Transactie[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    bank_name: '',
    account_number_masked: '',
    balance: '',
    color_gradient: 'blue',
  });
  const sb = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const [{ data: rek }, { data: tx }] = await Promise.all([
      sb.from('accounts').select('*').eq('user_id', user.id),
      sb.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(50),
    ]);
    setRekeningen((rek || []) as unknown as Rekening[]);
    setTransacties((tx || []) as unknown as Transactie[]);
  }

  async function addRekening() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !form.name) return;
    const r = {
      user_id: user.id,
      name: form.name,
      bank_name: form.bank_name,
      account_number_masked: form.account_number_masked,
      balance: parseFloat(form.balance) || 0,
      color_gradient: form.color_gradient,
    };
    const { data } = await sb.from('accounts').insert(r).select().single();
    if (data) { setRekeningen(prev => [...prev, data as unknown as Rekening]); setShowAdd(false); }
  }

  const selTx = selected ? transacties.filter(t => t.account_id === selected) : transacties;

  return (
    <div className="px-7 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Rekeningen</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 gradient-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
        >
          <Plus size={16} /> Toevoegen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {rekeningen.map(r => (
          <div
            key={r.id}
            onClick={() => setSelected(selected === r.id ? null : r.id)}
            className="relative rounded-2xl p-6 h-48 flex flex-col justify-between cursor-pointer overflow-hidden hover:-translate-y-1 transition-transform"
            style={{ background: GRADS[r.color_gradient] || GRADS.blue }}
          >
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-4 w-48 h-48 rounded-full bg-white/5" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-white/80 text-sm font-semibold">{r.bank_name}</span>
              <div className="w-8 h-6 rounded bg-gradient-to-br from-yellow-300 to-yellow-500" />
            </div>
            <div className="relative z-10">
              <div className="font-mono text-white/90 text-base tracking-widest mb-3">
                {r.account_number_masked || '•••• •••• •••• 0000'}
              </div>
              <div className="flex items-end justify-between">
                <span className="text-white/70 text-xs uppercase tracking-wide">{r.name}</span>
                <span className="font-mono text-2xl font-bold text-white">{fmt(r.balance)}</span>
              </div>
            </div>
          </div>
        ))}
        {!rekeningen.length && (
          <div className="col-span-2 card p-12 text-center text-gray-400">
            <p className="text-3xl mb-2">🏦</p>
            <p>Voeg je eerste rekening toe</p>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-base font-bold mb-4">
          {selected ? 'Transacties — ' + rekeningen.find(r => r.id === selected)?.name : 'Alle transacties'}
        </h2>
        {selTx.slice(0, 20).map(t => (
          <div key={t.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base">
              {t.type === 'income' ? '💰' : '🧾'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.description}</p>
              <p className="text-xs text-gray-400">{fmtDate(t.date)}</p>
            </div>
            <p className={`font-mono text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </p>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Rekening toevoegen</h2>
              <button onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {(['name', 'bank_name', 'account_number_masked', 'balance'] as const).map(k => {
                const labels: Record<string, string> = { name: 'Naam', bank_name: 'Bank', account_number_masked: 'Rekeningnummer', balance: 'Beginsaldo' };
                const placeholders: Record<string, string> = { name: 'Betaalrekening', bank_name: 'ING, Rabobank...', account_number_masked: '**** 1234', balance: '0.00' };
                return (
                  <div key={k}>
                    <label className="text-sm font-medium text-gray-700 block mb-1">{labels[k]}</label>
                    <input
                      type={k === 'balance' ? 'number' : 'text'}
                      placeholder={placeholders[k]}
                      value={form[k]}
                      onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                );
              })}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Kleur</label>
                <div className="flex gap-2">
                  {(['blue', 'teal', 'purple', 'green'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setForm(f => ({ ...f, color_gradient: g }))}
                      className={`flex-1 h-8 rounded-lg transition ${form.color_gradient === g ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ background: GRADS[g] }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50">
                Annuleren
              </button>
              <button onClick={addRekening} className="flex-1 gradient-blue text-white rounded-lg py-2.5 text-sm font-semibold">
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
